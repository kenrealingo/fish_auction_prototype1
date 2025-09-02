import { describe, it, expect, beforeEach } from 'vitest'
import {
  isAuctionActive,
  hasAuctionEnded,
  canStartAuction,
  validateBid,
  getNextMinimumBid,
  getWinningBid,
  closeAuction,
  addBidToAuction,
  getAuctionDuration,
  getTimeRemaining,
  formatTimeRemaining,
  type AuctionState,
  type Bid
} from '@/lib/auction-utils'

describe('Auction Utilities', () => {
  let mockAuction: AuctionState
  let mockBid: Bid

  beforeEach(() => {
    const now = new Date()
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
    
    mockAuction = {
      lotId: 'lot-1',
      status: 'open',
      startTime: now,
      endTime: oneHourFromNow,
      minimumBidCents: 10000, // $100
      bidIncrementCents: 500, // $5
      currentHighestBidCents: 12000, // $120
      totalBids: 1,
      bids: []
    }

    mockBid = {
      id: 'bid-1',
      lotId: 'lot-1',
      buyerId: 'buyer-1',
      bidAmountCents: 13000, // $130
      timestamp: new Date()
    }
  })

  describe('isAuctionActive', () => {
    it('should return true for open auction within time window', () => {
      expect(isAuctionActive(mockAuction)).toBe(true)
    })

    it('should return false for closed auction', () => {
      mockAuction.status = 'closed'
      expect(isAuctionActive(mockAuction)).toBe(false)
    })

    it('should return false for auction that has not started', () => {
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
      mockAuction.startTime = future
      mockAuction.endTime = new Date(future.getTime() + 60 * 60 * 1000)
      expect(isAuctionActive(mockAuction)).toBe(false)
    })

    it('should return false for auction that has ended', () => {
      const past = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      mockAuction.startTime = past
      mockAuction.endTime = new Date(past.getTime() + 60 * 60 * 1000) // 1 hour ago
      expect(isAuctionActive(mockAuction)).toBe(false)
    })
  })

  describe('hasAuctionEnded', () => {
    it('should return false for ongoing auction', () => {
      expect(hasAuctionEnded(mockAuction)).toBe(false)
    })

    it('should return true for ended auction', () => {
      mockAuction.endTime = new Date(Date.now() - 1000) // 1 second ago
      expect(hasAuctionEnded(mockAuction)).toBe(true)
    })
  })

  describe('canStartAuction', () => {
    it('should return true for closed auction at start time', () => {
      mockAuction.status = 'closed'
      expect(canStartAuction(mockAuction)).toBe(true)
    })

    it('should return false for already open auction', () => {
      mockAuction.status = 'open'
      expect(canStartAuction(mockAuction)).toBe(false)
    })

    it('should return false if start time has not arrived', () => {
      mockAuction.status = 'closed'
      mockAuction.startTime = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
      expect(canStartAuction(mockAuction)).toBe(false)
    })
  })

  describe('validateBid', () => {
    it('should accept valid bid', () => {
      const result = validateBid(mockAuction, 13000) // $130
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject bid below minimum', () => {
      const result = validateBid(mockAuction, 5000) // $50 (below $100 minimum)
      expect(result.success).toBe(false)
      expect(result.error).toContain('at least $100.00')
    })

    it('should reject bid that does not meet increment', () => {
      const result = validateBid(mockAuction, 12200) // $122 (needs to be $125 = $120 + $5)
      expect(result.success).toBe(false)
      expect(result.error).toContain('at least $125.00')
    })

    it('should reject bid on inactive auction', () => {
      mockAuction.status = 'closed'
      const result = validateBid(mockAuction, 15000)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Auction is not currently active')
    })

    it('should reject invalid bid amounts', () => {
      const result1 = validateBid(mockAuction, -1000)
      expect(result1.success).toBe(false)
      
      const result2 = validateBid(mockAuction, 0)
      expect(result2.success).toBe(false)
    })
  })

  describe('getNextMinimumBid', () => {
    it('should return minimum bid when no bids exist', () => {
      mockAuction.currentHighestBidCents = 0
      expect(getNextMinimumBid(mockAuction)).toBe(10000) // $100
    })

    it('should return current high + increment when bids exist', () => {
      expect(getNextMinimumBid(mockAuction)).toBe(12500) // $120 + $5 = $125
    })
  })

  describe('getWinningBid', () => {
    it('should return null when no bids', () => {
      expect(getWinningBid(mockAuction)).toBe(null)
    })

    it('should return highest bid', () => {
      const bid1: Bid = {
        id: 'bid-1',
        lotId: 'lot-1',
        buyerId: 'buyer-1',
        bidAmountCents: 12000,
        timestamp: new Date(Date.now() - 1000)
      }
      
      const bid2: Bid = {
        id: 'bid-2',
        lotId: 'lot-1',
        buyerId: 'buyer-2',
        bidAmountCents: 15000, // Higher bid
        timestamp: new Date()
      }

      mockAuction.bids = [bid1, bid2]
      const winner = getWinningBid(mockAuction)
      expect(winner).toBe(bid2)
    })

    it('should return earliest bid in case of tie', () => {
      const earlierTime = new Date(Date.now() - 1000)
      const laterTime = new Date()

      const bid1: Bid = {
        id: 'bid-1',
        lotId: 'lot-1',
        buyerId: 'buyer-1',
        bidAmountCents: 15000,
        timestamp: earlierTime
      }
      
      const bid2: Bid = {
        id: 'bid-2',
        lotId: 'lot-1',
        buyerId: 'buyer-2',
        bidAmountCents: 15000, // Same amount
        timestamp: laterTime
      }

      mockAuction.bids = [bid2, bid1] // Add in reverse order
      const winner = getWinningBid(mockAuction)
      expect(winner).toBe(bid1) // Earlier timestamp wins
    })
  })

  describe('closeAuction', () => {
    it('should successfully close auction with winner', () => {
      mockAuction.bids = [mockBid]
      const result = closeAuction(mockAuction)
      
      expect(result.success).toBe(true)
      expect(result.winningBid).toBe(mockBid)
      expect(result.finalStatus).toBe('closed')
      expect(result.totalBids).toBe(1)
    })

    it('should close auction without winner when no bids', () => {
      const result = closeAuction(mockAuction)
      
      expect(result.success).toBe(true)
      expect(result.winningBid).toBe(null)
      expect(result.finalStatus).toBe('closed')
      expect(result.totalBids).toBe(0)
    })

    it('should handle already closed auction', () => {
      mockAuction.status = 'closed'
      const result = closeAuction(mockAuction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Auction is already closed')
    })

    it('should handle already closed auction (cancelled scenario)', () => {
      mockAuction.status = 'closed'
      const result = closeAuction(mockAuction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Auction is already closed')
    })
  })

  describe('addBidToAuction', () => {
    it('should add valid bid to auction', () => {
      const validBid: Bid = {
        id: 'bid-new',
        lotId: 'lot-1',
        buyerId: 'buyer-1',
        bidAmountCents: 13000, // $130 (valid increment)
        timestamp: new Date()
      }

      const updatedAuction = addBidToAuction(mockAuction, validBid)
      
      expect(updatedAuction.bids).toHaveLength(1)
      expect(updatedAuction.bids[0]).toBe(validBid)
      expect(updatedAuction.currentHighestBidCents).toBe(13000)
      expect(updatedAuction.totalBids).toBe(1)
    })

    it('should throw error for invalid bid', () => {
      const invalidBid: Bid = {
        id: 'bid-invalid',
        lotId: 'lot-1',
        buyerId: 'buyer-1',
        bidAmountCents: 5000, // Too low
        timestamp: new Date()
      }

      expect(() => addBidToAuction(mockAuction, invalidBid)).toThrow()
    })

    it('should maintain previous bids', () => {
      const bid1: Bid = {
        id: 'bid-1',
        lotId: 'lot-1',
        buyerId: 'buyer-1',
        bidAmountCents: 13000,
        timestamp: new Date(Date.now() - 1000)
      }

      mockAuction.bids = [bid1]
      mockAuction.currentHighestBidCents = 13000

      const bid2: Bid = {
        id: 'bid-2',
        lotId: 'lot-1',
        buyerId: 'buyer-2',
        bidAmountCents: 14000, // Higher bid
        timestamp: new Date()
      }

      const updatedAuction = addBidToAuction(mockAuction, bid2)
      
      expect(updatedAuction.bids).toHaveLength(2)
      expect(updatedAuction.currentHighestBidCents).toBe(14000)
    })
  })

  describe('getAuctionDuration', () => {
    it('should calculate duration in minutes', () => {
      const start = new Date()
      const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // 2 hours later
      expect(getAuctionDuration(start, end)).toBe(120) // 120 minutes
    })
  })

  describe('getTimeRemaining', () => {
    it('should return positive time for ongoing auction', () => {
      const remaining = getTimeRemaining(mockAuction)
      expect(remaining).toBeGreaterThan(0)
      expect(remaining).toBeLessThanOrEqual(60 * 60 * 1000) // Should be ≤ 1 hour
    })

    it('should return negative time for ended auction', () => {
      mockAuction.endTime = new Date(Date.now() - 1000) // 1 second ago
      const remaining = getTimeRemaining(mockAuction)
      expect(remaining).toBeLessThan(0)
    })
  })

  describe('formatTimeRemaining', () => {
    it('should format time correctly', () => {
      expect(formatTimeRemaining(0)).toBe('ENDED')
      expect(formatTimeRemaining(-1000)).toBe('ENDED')
      expect(formatTimeRemaining(30 * 1000)).toBe('30s') // 30 seconds
      expect(formatTimeRemaining(5 * 60 * 1000)).toBe('5m 0s') // 5 minutes
      expect(formatTimeRemaining(2 * 60 * 60 * 1000)).toBe('2h 0m 0s') // 2 hours
      expect(formatTimeRemaining(3665 * 1000)).toBe('1h 1m 5s') // 1h 1m 5s
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete auction lifecycle', () => {
      // Start with closed auction (ready to start)
      mockAuction.status = 'closed'
      expect(canStartAuction(mockAuction)).toBe(true)
      
      // Open auction
      mockAuction.status = 'open'
      expect(isAuctionActive(mockAuction)).toBe(true)
      
      // Add first bid
      const bid1: Bid = {
        id: 'bid-1',
        lotId: 'lot-1',
        buyerId: 'buyer-1',
        bidAmountCents: 12500, // $125 (meets minimum requirement)
        timestamp: new Date(Date.now() - 2000)
      }
      
      let updatedAuction = addBidToAuction(mockAuction, bid1)
      expect(updatedAuction.currentHighestBidCents).toBe(12500)
      
      // Add higher bid
      const bid2: Bid = {
        id: 'bid-2',
        lotId: 'lot-1',
        buyerId: 'buyer-2',
        bidAmountCents: 13000, // $130 (valid increment from $125)
        timestamp: new Date(Date.now() - 1000)
      }
      
      updatedAuction = addBidToAuction(updatedAuction, bid2)
      expect(updatedAuction.currentHighestBidCents).toBe(13000)
      
      // Close auction
      const closeResult = closeAuction(updatedAuction)
      expect(closeResult.success).toBe(true)
      expect(closeResult.winningBid).toBe(bid2)
      expect(closeResult.totalBids).toBe(2)
    })

    it('should enforce bidding rules strictly', () => {
      // Test minimum bid enforcement
      const tooLowBid = validateBid(mockAuction, mockAuction.minimumBidCents - 100)
      expect(tooLowBid.success).toBe(false)
      
      // Test increment enforcement
      const tooSmallIncrement = validateBid(mockAuction, mockAuction.currentHighestBidCents + 100)
      expect(tooSmallIncrement.success).toBe(false)
      
      // Test valid bid
      const validBid = validateBid(mockAuction, mockAuction.currentHighestBidCents + mockAuction.bidIncrementCents)
      expect(validBid.success).toBe(true)
    })
  })
})
