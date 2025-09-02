'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface DashboardMetrics {
  todayTransactions: number
  todayGrossAmount: number
  todayCommissions: number
  activeLots: number
  openAuctions: number
  pendingApprovals: number
}

export interface RecentEvent {
  id: string
  type: 'LOT_CREATED' | 'BID_PLACED' | 'AUCTION_CLOSED' | 'TRANSACTION_CREATED'
  title: string
  description: string
  timestamp: string
  amount?: number
  lotNumber?: string
  fishType?: string
  supplierName?: string
  buyerName?: string
}

export interface ChartDataPoint {
  date: string
  transactions: number
  revenue: number
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Get today's date range
  const today = new Date()
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)

  // For demo purposes, return mock metrics since we don't have real data yet
  // In production, these would be real Prisma queries
  
  const mockMetrics: DashboardMetrics = {
    todayTransactions: 8,
    todayGrossAmount: 345600, // ₱3,456.00
    todayCommissions: 20736,  // ₱207.36 (6%)
    activeLots: 12,
    openAuctions: 3,
    pendingApprovals: 5
  }

  return mockMetrics

  // Real Prisma queries would look like this:
  /*
  const [todayTransactions, activeLots, openAuctions, pendingApprovals] = await Promise.all([
    // Today's transactions
    prisma.transaction.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    }),
    
    // Active lots (not sold yet)
    prisma.lot.count({
      where: {
        status: {
          in: ['PENDING_SUPPLIER_APPROVAL', 'ACTIVE', 'AUCTION_SCHEDULED', 'AUCTION_ACTIVE']
        }
      }
    }),
    
    // Open auctions
    prisma.lot.count({
      where: {
        auctionStatus: 'OPEN'
      }
    }),
    
    // Pending approvals
    prisma.lot.count({
      where: {
        status: 'PENDING_SUPPLIER_APPROVAL'
      }
    })
  ])

  // Calculate today's gross amount and commissions
  const todayTransactionData = await prisma.transaction.aggregate({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    },
    _sum: {
      grossAmount: true
    }
  })

  const todayGrossAmount = todayTransactionData._sum.grossAmount || 0
  const todayCommissions = Math.round(todayGrossAmount * 0.06)

  return {
    todayTransactions,
    todayGrossAmount,
    todayCommissions,
    activeLots,
    openAuctions,
    pendingApprovals
  }
  */
}

export async function getRecentEvents(): Promise<RecentEvent[]> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // For demo purposes, return mock recent events
  const mockEvents: RecentEvent[] = [
    {
      id: 'evt1',
      type: 'TRANSACTION_CREATED',
      title: 'Transaction Completed',
      description: 'Atlantic Salmon lot sold to Ocean Fresh Markets',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      amount: 67800,
      lotNumber: 'LOT-20250902-001',
      fishType: 'Atlantic Salmon',
      supplierName: 'Atlantic Fisheries',
      buyerName: 'Ocean Fresh Markets'
    },
    {
      id: 'evt2',
      type: 'AUCTION_CLOSED',
      title: 'Auction Closed',
      description: 'Red Snapper auction ended with winning bid',
      timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
      amount: 45000,
      lotNumber: 'LOT-20250902-002',
      fishType: 'Red Snapper',
      supplierName: 'Gulf Coast Fishing'
    },
    {
      id: 'evt3',
      type: 'BID_PLACED',
      title: 'New Bid Placed',
      description: 'Sushi Master Restaurant placed bid on Yellowfin Tuna',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      amount: 37200,
      lotNumber: 'LOT-20250902-003',
      fishType: 'Yellowfin Tuna',
      buyerName: 'Sushi Master Restaurant'
    },
    {
      id: 'evt4',
      type: 'LOT_CREATED',
      title: 'New Lot Created',
      description: 'Pacific Salmon lot added by Coastal Fisheries',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      lotNumber: 'LOT-20250902-004',
      fishType: 'Pacific Salmon',
      supplierName: 'Coastal Fisheries'
    },
    {
      id: 'evt5',
      type: 'TRANSACTION_CREATED',
      title: 'Transaction Completed',
      description: 'Mahi-Mahi lot sold to Harbor Seafood',
      timestamp: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      amount: 52300,
      lotNumber: 'LOT-20250901-015',
      fishType: 'Mahi-Mahi',
      supplierName: 'Tropical Waters Co.',
      buyerName: 'Harbor Seafood'
    }
  ]

  return mockEvents

  // Real Prisma queries would aggregate data from multiple tables:
  /*
  const [newLots, newBids, closedAuctions, newTransactions] = await Promise.all([
    // Recent lots
    prisma.lot.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true
      }
    }),
    
    // Recent bids (would need a Bid model)
    // prisma.bid.findMany({ ... }),
    
    // Recent auction closures (lots that changed status)
    // Could track via status change logs
    
    // Recent transactions
    prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        lot: {
          include: {
            supplier: true
          }
        },
        buyer: true
      }
    })
  ])
  */
}

export async function getChartData(): Promise<ChartDataPoint[]> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  // Mock chart data for the past 7 days
  const chartData: ChartDataPoint[] = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate mock data with some variation
    const baseTransactions = 8
    const variation = Math.floor(Math.random() * 6) - 3 // -3 to +2
    const transactions = Math.max(1, baseTransactions + variation)
    const avgRevenuePerTransaction = 45000 // ₱450
    const revenue = transactions * avgRevenuePerTransaction * (0.8 + Math.random() * 0.4) // 80% to 120%
    
    chartData.push({
      date: date.toISOString().slice(0, 10),
      transactions,
      revenue: Math.round(revenue)
    })
  }

  return chartData

  // Real Prisma query would group transactions by date:
  /*
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const transactionsByDay = await prisma.$queryRaw`
    SELECT 
      DATE(createdAt) as date,
      COUNT(*) as transactions,
      SUM(grossAmount) as revenue
    FROM Transaction 
    WHERE createdAt >= ${sevenDaysAgo}
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `
  */
}
