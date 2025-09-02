/**
 * Auction logic utilities for managing auction lifecycle and bid validation
 */

export type AuctionStatus = 'open' | 'closed'
export type LotStatus = 'drafted' | 'listed' | 'bidding' | 'pending_supplier_approval' | 'approved' | 'rejected' | 'sold' | 'canceled'

export interface Bid {
  id: string
  lotId: string
  buyerId: string
  bidAmountCents: number
  timestamp: Date
  isWinning?: boolean
}

export interface AuctionState {
  lotId: string
  status: AuctionStatus
  startTime: Date
  endTime: Date
  minimumBidCents: number
  bidIncrementCents: number
  currentHighestBidCents: number
  totalBids: number
  bids: Bid[]
}

/**
 * Check if auction is currently active
 * @param auction - Auction state
 * @returns true if auction is open and within time window
 */
export function isAuctionActive(auction: AuctionState): boolean {
  const now = new Date()
  return (
    auction.status === 'open' &&
    now >= auction.startTime &&
    now <= auction.endTime
  )
}

/**
 * Check if auction has ended
 * @param auction - Auction state
 * @returns true if auction end time has passed
 */
export function hasAuctionEnded(auction: AuctionState): boolean {
  const now = new Date()
  return now > auction.endTime
}

/**
 * Check if auction can be started
 * @param auction - Auction state
 * @returns true if auction can be started
 */
export function canStartAuction(auction: AuctionState): boolean {
  const now = new Date()
  return (
    auction.status === 'closed' && // Assuming 'closed' means 'not yet started'
    now >= auction.startTime
  )
}

/**
 * Validate a new bid
 * @param auction - Current auction state
 * @param bidAmountCents - Bid amount in centavos
 * @returns Validation result with success flag and error message
 */
export function validateBid(
  auction: AuctionState,
  bidAmountCents: number
): { success: boolean; error?: string } {
  // Check if auction is active
  if (!isAuctionActive(auction)) {
    return { success: false, error: 'Auction is not currently active' }
  }

  // Check if bid meets minimum requirement
  if (bidAmountCents < auction.minimumBidCents) {
    return { 
      success: false, 
      error: `Bid must be at least $${(auction.minimumBidCents / 100).toFixed(2)}` 
    }
  }

  // Check if bid meets increment requirement
  const requiredMinimum = auction.currentHighestBidCents + auction.bidIncrementCents
  if (bidAmountCents < requiredMinimum) {
    return {
      success: false,
      error: `Bid must be at least $${(requiredMinimum / 100).toFixed(2)} (current high + increment)`
    }
  }

  // Check for valid bid amount
  if (!Number.isInteger(bidAmountCents) || bidAmountCents <= 0) {
    return { success: false, error: 'Invalid bid amount' }
  }

  return { success: true }
}

/**
 * Calculate next minimum bid amount
 * @param auction - Current auction state
 * @returns Next minimum bid in centavos
 */
export function getNextMinimumBid(auction: AuctionState): number {
  if (auction.currentHighestBidCents === 0) {
    return auction.minimumBidCents
  }
  return auction.currentHighestBidCents + auction.bidIncrementCents
}

/**
 * Get winning bid from auction
 * @param auction - Auction state
 * @returns Winning bid or null if no bids
 */
export function getWinningBid(auction: AuctionState): Bid | null {
  if (auction.bids.length === 0) {
    return null
  }

  // Sort bids by amount (highest first), then by timestamp (earliest first for ties)
  const sortedBids = [...auction.bids].sort((a, b) => {
    if (a.bidAmountCents !== b.bidAmountCents) {
      return b.bidAmountCents - a.bidAmountCents
    }
    return a.timestamp.getTime() - b.timestamp.getTime()
  })

  return sortedBids[0]
}

/**
 * Process auction closure
 * @param auction - Auction state
 * @returns Closure result with winner info and final state
 */
export function closeAuction(auction: AuctionState): {
  success: boolean
  winningBid: Bid | null
  finalStatus: AuctionStatus
  totalBids: number
  error?: string
} {
  // Check if auction can be closed
  if (auction.status === 'closed') {
    return {
      success: false,
      winningBid: null,
      finalStatus: 'closed',
      totalBids: auction.totalBids,
      error: 'Auction is already closed'
    }
  }

  // Get winning bid
  const winningBid = getWinningBid(auction)

  return {
    success: true,
    winningBid,
    finalStatus: 'closed',
    totalBids: auction.bids.length
  }
}

/**
 * Add bid to auction
 * @param auction - Current auction state
 * @param bid - New bid to add
 * @returns Updated auction state
 */
export function addBidToAuction(auction: AuctionState, bid: Bid): AuctionState {
  const validation = validateBid(auction, bid.bidAmountCents)
  if (!validation.success) {
    throw new Error(validation.error)
  }

  const updatedBids = [...auction.bids, bid]
  const newHighestBid = Math.max(auction.currentHighestBidCents, bid.bidAmountCents)

  return {
    ...auction,
    bids: updatedBids,
    currentHighestBidCents: newHighestBid,
    totalBids: updatedBids.length
  }
}

/**
 * Calculate auction duration in minutes
 * @param startTime - Auction start time
 * @param endTime - Auction end time
 * @returns Duration in minutes
 */
export function getAuctionDuration(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
}

/**
 * Calculate time remaining in auction
 * @param auction - Auction state
 * @returns Time remaining in milliseconds (negative if ended)
 */
export function getTimeRemaining(auction: AuctionState): number {
  const now = new Date()
  return auction.endTime.getTime() - now.getTime()
}

/**
 * Format time remaining for display
 * @param milliseconds - Time remaining in milliseconds
 * @returns Formatted time string (e.g., "5m 30s", "ENDED")
 */
export function formatTimeRemaining(milliseconds: number): string {
  if (milliseconds <= 0) {
    return 'ENDED'
  }

  const totalSeconds = Math.floor(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`
  } else {
    return `${seconds}s`
  }
}
