// Example queries for the Fish Auction database
// Run these in Prisma Studio or in your application code

import { prisma } from '../src/lib/prisma'

// Get all active auctions with their lots and current bids
export async function getActiveAuctions() {
  return await prisma.auction.findMany({
    where: { status: 'ACTIVE' },
    include: {
      lot: {
        include: {
          supplier: {
            include: { user: true }
          }
        }
      },
      bids: {
        orderBy: { amount: 'desc' },
        take: 1,
        include: {
          buyerUser: true
        }
      }
    }
  })
}

// Get supplier's lots and earnings
export async function getSupplierDashboard(supplierId: string) {
  const lots = await prisma.catchLot.findMany({
    where: { supplierId },
    include: {
      auction: true,
      transaction: true
    }
  })

  const totalEarnings = await prisma.transaction.aggregate({
    where: {
      user: {
        supplier: { id: supplierId }
      },
      type: 'SALE',
      amount: { gt: 0 }
    },
    _sum: { netAmount: true }
  })

  return { lots, totalEarnings: totalEarnings._sum.netAmount || 0 }
}

// Get buyer's bid history and purchases
export async function getBuyerHistory(buyerId: string) {
  return await prisma.bid.findMany({
    where: { bidderId: buyerId },
    include: {
      lot: true,
      auction: true,
      transaction: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Get daily auction statistics
export async function getDailyStats(date: Date) {
  const report = await prisma.dailyReport.findUnique({
    where: { reportDate: date }
  })

  const completedAuctions = await prisma.auction.count({
    where: {
      status: 'COMPLETED',
      endTime: {
        gte: new Date(date.getTime()),
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })

  return { report, completedAuctions }
}

// Get commission and fees summary for broker
export async function getBrokerRevenue() {
  return await prisma.transaction.aggregate({
    where: {
      type: 'COMMISSION'
    },
    _sum: {
      commission: true,
      laborFee: true,
      amount: true
    },
    _count: true
  })
}

// Get top fish types by volume
export async function getTopFishTypes() {
  return await prisma.catchLot.groupBy({
    by: ['fishType'],
    _sum: {
      weight: true
    },
    _count: {
      fishType: true
    },
    orderBy: {
      _sum: {
        weight: 'desc'
      }
    }
  })
}

// Get pending settlements
export async function getPendingSettlements() {
  return await prisma.settlement.findMany({
    where: { status: 'PENDING' },
    include: {
      user: true,
      transaction: true
    },
    orderBy: { scheduledAt: 'asc' }
  })
}
