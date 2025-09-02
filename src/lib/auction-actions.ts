"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
  message?: string
}

export async function startAuction(lotId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'BROKER') {
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

      if (lot.status !== 'AVAILABLE') {
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

      // Calculate start price (80% of reserve price)
      const startPrice = lot.reservePrice ? Math.floor(lot.reservePrice * 0.8) : Math.floor(lot.weight * 1000) // Default fallback

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
        data: { status: 'IN_AUCTION' }
      })

      return auction
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error starting auction:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to start auction" 
    }
  }
}

export async function closeAuction(auctionId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'BROKER') {
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
              buyerUser: true
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

        // Update lot status to pending supplier approval
        await tx.catchLot.update({
          where: { id: auction.lotId },
          data: { status: 'PENDING_SUPPLIER_APPROVAL' as any }
        })
      } else {
        // No bids - mark as unsold
        await tx.catchLot.update({
          where: { id: auction.lotId },
          data: { status: 'UNSOLD' }
        })
      }

      return { auction: updatedAuction, winningBid: highestBid }
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error closing auction:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to close auction" 
    }
  }
}

export async function placeBid(auctionId: string, amount: number): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    // Use Prisma transaction to ensure bid consistency
    const result = await prisma.$transaction(async (tx) => {
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
      const minBidAmount = auction.currentPrice! + 500 // Minimum increment of $5.00
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

      // Get buyer information 
      const buyer = await tx.buyer.findFirst({
        where: { user: { email: session.user.email } }
      })

      if (!buyer) {
        throw new Error("Buyer profile not found")
      }

      // Create new bid
      const bid = await tx.bid.create({
        data: {
          bidNumber,
          auctionId,
          lotId: auction.lotId,
          bidderId: buyer.id,
          buyerUserId: session.user.id,
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

    return { success: true, data: result }
  } catch (error) {
    console.error("Error placing bid:", error)
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
            buyerUser: true
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

export async function approveLotSale(lotId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return { success: false, error: "Unauthorized: Only suppliers can approve lot sales" }
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get lot with auction and winning bid details
      const lot = await tx.catchLot.findUnique({
        where: { id: lotId },
        include: {
          supplier: { include: { user: true } },
          auction: {
            include: {
              bids: {
                where: { isWinning: true },
                include: { buyerUser: true }
              }
            }
          }
        }
      })

      if (!lot) {
        throw new Error("Lot not found")
      }

      // Check if user owns this lot
      if (lot.supplier.user.email !== session.user.email) {
        throw new Error("Unauthorized: You can only approve your own lots")
      }

      if (lot.status !== ('PENDING_SUPPLIER_APPROVAL' as any)) {
        throw new Error("Lot is not pending approval")
      }

      if (!lot.auction || !lot.auction.bids.length) {
        throw new Error("No winning bid found for this lot")
      }

      const winningBid = lot.auction.bids[0]

      // Generate transaction number
      const transactionNumber = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Calculate breakdown
      const grossAmount = winningBid.amount
      const commissionCents = Math.round(grossAmount * 0.06)
      const laborFeeCents = 2500
      const netToSupplierCents = grossAmount - commissionCents - laborFeeCents

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          lotId,
          bidId: winningBid.id,
          userId: winningBid.buyerUser.id,
          type: 'SALE',
          amount: grossAmount,
          saleAmount: grossAmount,
          commission: commissionCents,
          laborFee: laborFeeCents,
          netAmount: netToSupplierCents,
          description: `Sale of ${lot.fishType} - Lot ${lot.lotNumber}`
        }
      })

      // Generate settlement number
      const settlementNumber = `SET-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Create settlement record for supplier
      const settlement = await tx.settlement.create({
        data: {
          settlementNumber,
          userId: lot.supplier.user.id, // Settlement is for the supplier
          transactionId: transaction.id,
          amount: netToSupplierCents, // Amount to be settled is the net amount
          status: 'PENDING',
          notes: `Settlement for lot ${lot.lotNumber} sold to ${winningBid.buyerUser.name || winningBid.buyerUser.email}. Gross: $${(grossAmount/100).toFixed(2)}, Commission: $${(commissionCents/100).toFixed(2)}, Labor: $${(laborFeeCents/100).toFixed(2)}, Net: $${(netToSupplierCents/100).toFixed(2)}`
        }
      })

      // Update lot status to sold
      const updatedLot = await tx.catchLot.update({
        where: { id: lotId },
        data: { status: 'SOLD' }
      })

      return { transaction, settlement, lot: updatedLot, winningBid }
    })

    return { 
      success: true, 
      data: result,
      message: "Lot sale approved successfully" 
    }
  } catch (error) {
    console.error("Error approving lot sale:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to approve lot sale" 
    }
  }
}

export async function rejectLotSale(lotId: string): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'SUPPLIER') {
      return { success: false, error: "Unauthorized: Only suppliers can reject lot sales" }
    }

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get lot with supplier details
      const lot = await tx.catchLot.findUnique({
        where: { id: lotId },
        include: {
          supplier: { include: { user: true } },
          auction: {
            include: {
              bids: {
                where: { isWinning: true }
              }
            }
          }
        }
      })

      if (!lot) {
        throw new Error("Lot not found")
      }

      // Check if user owns this lot
      if (lot.supplier.user.email !== session.user.email) {
        throw new Error("Unauthorized: You can only reject your own lots")
      }

      if (lot.status !== ('PENDING_SUPPLIER_APPROVAL' as any)) {
        throw new Error("Lot is not pending approval")
      }

      // Reset all winning bids to false
      if (lot.auction) {
        await tx.bid.updateMany({
          where: { 
            auctionId: lot.auction.id,
            isWinning: true 
          },
          data: { isWinning: false }
        })
      }

      // Return lot to listed status
      const updatedLot = await tx.catchLot.update({
        where: { id: lotId },
        data: { status: 'AVAILABLE' }
      })

      return { lot: updatedLot }
    })

    return { 
      success: true, 
      data: result,
      message: "Lot sale rejected - returned to available status" 
    }
  } catch (error) {
    console.error("Error rejecting lot sale:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to reject lot sale" 
    }
  }
}
