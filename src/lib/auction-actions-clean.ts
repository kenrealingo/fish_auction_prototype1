"use server"

import { getServerSession } from "next-auth/next"
import { PrismaClient, LotStatus } from "@prisma/client"
import { logger } from "./logger"
import { auditLogger } from "./audit-logger"
import { AuditEventType } from "../types/audit"

// Simple auth options - can be extended later
const authOptions = {
  pages: {
    signIn: '/auth/signin',
  },
} as any

// Session type for testing
interface SessionUser {
  id: string
  role: 'BROKER' | 'BUYER' | 'SUPPLIER'
  email: string
}

interface CustomSession {
  user?: SessionUser
}

const prisma = new PrismaClient()

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
  message?: string
}

export async function startAuction(lotId: string): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('startAuction', { 
      requestId,
      metadata: { lotId }
    })

    const session = await getServerSession(authOptions) as CustomSession
    
    if (!session?.user || session.user.role !== 'BROKER') {
      await auditLogger.logPermissionDenied('auction', 'start', {
        performedBy: session?.user?.id,
        requestId,
      })
      return { success: false, error: "Unauthorized: Only brokers can start auctions" }
    }

    // Use Prisma transaction to enforce one open auction per lot
    const result = await prisma.$transaction(async (tx) => {
      // Check if lot exists and is available
      const lot = await tx.catchLot.findUnique({
        where: { id: lotId }
      })

      if (!lot) {
        throw new Error("Lot not found")
      }

      if (lot.status !== LotStatus.AVAILABLE) {
        throw new Error("Lot is not available for auction")
      }

      // Check for existing active auctions for this lot
      const existingActiveAuction = await tx.auction.findFirst({
        where: {
          lotId,
          status: 'ACTIVE'
        }
      })

      if (existingActiveAuction) {
        throw new Error("There is already an active auction for this lot")
      }

      // Generate auction number
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const auctionCount = await tx.auction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
      const auctionNumber = `AUC-${today}-${String(auctionCount + 1).padStart(3, '0')}`

      // Calculate start price (minimum bid from our schema, or default based on weight)
      const startPrice = lot.weight ? Math.floor(lot.weight * 10000) : 50000 // Default ₱500 or ₱100/kg

      // Create auction
      const auction = await tx.auction.create({
        data: {
          auctionNumber,
          lotId,
          status: 'ACTIVE',
          startPrice,
          currentPrice: startPrice,
          startTime: new Date(),
          endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
          duration: 8 * 60 * 60 // 8 hours in seconds
        }
      })

      // Update lot status
      await tx.catchLot.update({
        where: { id: lotId },
        data: { 
          status: LotStatus.IN_AUCTION
        }
      })

      return auction
    })

    // Log successful auction start
    await auditLogger.logAuctionStarted(result.id, {
      auctionNumber: result.auctionNumber,
      lotId,
      startPrice: result.startPrice,
      startTime: result.startTime,
      endTime: result.endTime,
    }, {
      performedBy: session.user!.id,
      requestId,
    })

    logger.info('Auction started successfully', {
      requestId,
      userId: session.user!.id,
      metadata: { 
        auctionId: result.id, 
        auctionNumber: result.auctionNumber,
        lotId 
      }
    })

    return { success: true, data: result }
  } catch (error) {
    logger.error("Error starting auction", {
      requestId,
      metadata: { lotId, error }
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to start auction" 
    }
  }
}

export async function closeAuction(auctionId: string): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('closeAuction', { 
      requestId,
      metadata: { auctionId }
    })

    const session = await getServerSession(authOptions) as CustomSession
    
    if (!session?.user || session.user.role !== 'BROKER') {
      await auditLogger.logPermissionDenied('auction', 'close', {
        performedBy: session?.user?.id,
        requestId,
      })
      return { success: false, error: "Unauthorized: Only brokers can close auctions" }
    }

    // Use Prisma transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get auction with its bids and lot
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          lot: true,
          bids: {
            orderBy: { amount: 'desc' },
            include: {
              buyerUser: true,
              bidder: {
                include: { user: true }
              }
            }
          }
        }
      })

      if (!auction) {
        throw new Error("Auction not found")
      }

      if (auction.status !== 'ACTIVE') {
        throw new Error("Auction is not active")
      }

      // Get highest bid
      const highestBid = auction.bids[0]
      
      // Update auction status
      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
          winningBidId: highestBid?.id || null,
          currentPrice: highestBid?.amount || auction.startPrice
        }
      })

      // Update winning bid status
      if (highestBid) {
        await tx.bid.update({
          where: { id: highestBid.id },
          data: { isWinning: true }
        })

        // Set all other bids as not winning
        await tx.bid.updateMany({
          where: {
            auctionId: auctionId,
            id: { not: highestBid.id }
          },
          data: { isWinning: false }
        })

        // Update lot status to sold (winning bid)
        await tx.catchLot.update({
          where: { id: auction.lotId },
          data: { status: LotStatus.SOLD }
        })
      } else {
        // No bids - mark as unsold
        await tx.catchLot.update({
          where: { id: auction.lotId },
          data: { status: LotStatus.UNSOLD }
        })
      }

      return { auction: updatedAuction, winningBid: highestBid }
    })

    // Log successful auction close
    await auditLogger.logAuctionClosed(auctionId, {
      status: result.auction.status,
      endTime: result.auction.endTime,
      winningBidId: result.auction.winningBidId,
      finalPrice: result.auction.currentPrice,
      hadBids: !!result.winningBid,
    }, {
      performedBy: session.user!.id,
      requestId,
    })

    logger.info('Auction closed successfully', {
      requestId,
      userId: session.user!.id,
      metadata: { 
        auctionId,
        finalPrice: result.auction.currentPrice,
        winningBidId: result.auction.winningBidId,
        hadBids: !!result.winningBid
      }
    })

    return { success: true, data: result }
  } catch (error) {
    logger.error("Error closing auction", {
      requestId,
      metadata: { auctionId, error }
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to close auction" 
    }
  }
}

export async function placeBid(auctionId: string, amount: number): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('placeBid', { 
      requestId,
      metadata: { auctionId, amount }
    })

    const session = await getServerSession(authOptions) as CustomSession
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    if (session.user.role !== 'BUYER') {
      await auditLogger.logPermissionDenied('bid', 'place', {
        performedBy: session.user.id,
        requestId,
      })
      return { success: false, error: "Unauthorized: Only buyers can place bids" }
    }

    // Use Prisma transaction to ensure bid consistency
    const result = await prisma.$transaction(async (tx) => {
      // Get the buyer record for this user
      const buyer = await tx.buyer.findUnique({
        where: { userId: session.user!.id }
      })

      if (!buyer) {
        throw new Error("Buyer profile not found")
      }
      // Get auction details
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
        include: {
          lot: true,
          bids: {
            orderBy: { amount: 'desc' },
            take: 1
          }
        }
      })

      if (!auction) {
        throw new Error("Auction not found")
      }

      if (auction.status !== 'ACTIVE') {
        throw new Error("Auction is not active")
      }

      if (new Date() > new Date(auction.endTime!)) {
        throw new Error("Auction has ended")
      }

      // Check minimum bid amount
      const minBidAmount = auction.currentPrice! + 500 // Minimum increment of ₱5.00
      if (amount < minBidAmount) {
        throw new Error(`Minimum bid amount is ${minBidAmount / 100}`)
      }

      // Generate bid number
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const bidCount = await tx.bid.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
      const bidNumber = `BID-${today}-${String(bidCount + 1).padStart(3, '0')}`

      // Mark all previous bids for this auction as not winning
      await tx.bid.updateMany({
        where: { auctionId },
        data: { isWinning: false }
      })

      // Create new bid
      const bid = await tx.bid.create({
        data: {
          bidNumber,
          auctionId,
          lotId: auction.lotId,
          bidderId: buyer.id,
          buyerUserId: session.user!.id,
          amount,
          isWinning: true
        }
      })

      // Update auction current price
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: amount,
          winningBidId: bid.id
        }
      })

      return bid
    })

    // Log successful bid placement
    await auditLogger.logBidPlaced(result.id, {
      bidNumber: result.bidNumber,
      auctionId,
      lotId: result.lotId,
      amount: result.amount,
      bidderId: result.bidderId,
      buyerUserId: result.buyerUserId,
    }, {
      performedBy: session.user!.id,
      requestId,
    })

    logger.info('Bid placed successfully', {
      requestId,
      userId: session.user!.id,
      metadata: { 
        bidId: result.id,
        bidNumber: result.bidNumber,
        auctionId,
        amount: result.amount
      }
    })

    return { success: true, data: result }
  } catch (error) {
    logger.error("Error placing bid", {
      requestId,
      metadata: { auctionId, amount, error }
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to place bid" 
    }
  }
}

export async function getOpenAuctions(): Promise<ActionResult> {
  try {
    const auctions = await prisma.auction.findMany({
      where: {
        status: 'ACTIVE',
        endTime: {
          gt: new Date() // Only auctions that haven't ended yet
        }
      },
      include: {
        lot: {
          include: {
            supplier: {
              include: { user: true }
            }
          }
        },
        bids: {
          include: {
            buyerUser: true,
            bidder: {
              include: { user: true }
            }
          },
          orderBy: { amount: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return { success: true, data: auctions }
  } catch (error) {
    console.error("Error fetching open auctions:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch open auctions" 
    }
  }
}
