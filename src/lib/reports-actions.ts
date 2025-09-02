"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface DailyReportData {
  date: string
  summary: {
    totalTransactions: number
    totalGrossAmount: number
    totalCommissions: number
    totalLaborFees: number
    totalNetAmount: number
    totalSettlements: number
    pendingSettlements: number
    completedSettlements: number
    pendingAmount: number
    completedAmount: number
  }
  transactions: Array<{
    id: string
    transactionNumber: string
    lotNumber: string
    fishType: string
    supplierName: string
    buyerName: string
    grossAmount: number
    commission: number
    laborFee: number
    netAmount: number
    createdAt: string
  }>
  settlements: Array<{
    id: string
    settlementNumber: string
    supplierName: string
    amount: number
    status: string
    createdAt: string
    completedAt: string | null
  }>
}

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function getDailyReport(date: string): Promise<ActionResult & { data?: DailyReportData }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'BROKER') {
      return { success: false, error: "Unauthorized: Only brokers can generate reports" }
    }

    // For demo purposes, return mock data for today's date
    const today = new Date().toISOString().slice(0, 10)
    const isToday = date === today

    if (isToday) {
      // Mock data for today
      const mockSummary = {
        totalTransactions: 3,
        totalGrossAmount: 150000, // ₱1,500.00
        totalCommissions: 9000,   // ₱90.00 (6%)
        totalLaborFees: 7500,     // ₱75.00 (3 x ₱25)
        totalNetAmount: 133500,   // ₱1,335.00
        totalSettlements: 3,
        pendingSettlements: 2,
        completedSettlements: 1,
        pendingAmount: 89000,     // ₱890.00
        completedAmount: 44500    // ₱445.00
      }

      const mockTransactions = [
        {
          id: "txn1",
          transactionNumber: "TXN-20250902-001",
          lotNumber: "LOT-20250902-001",
          fishType: "Atlantic Salmon",
          supplierName: "Atlantic Fisheries",
          buyerName: "Ocean Fresh Markets",
          grossAmount: 67800,   // ₱678.00
          commission: 4068,     // ₱40.68
          laborFee: 2500,       // ₱25.00
          netAmount: 61232,     // ₱612.32
          createdAt: new Date().toISOString()
        },
        {
          id: "txn2",
          transactionNumber: "TXN-20250902-002",
          lotNumber: "LOT-20250902-002",
          fishType: "Red Snapper",
          supplierName: "Gulf Coast Fishing",
          buyerName: "Harbor Market Chain",
          grossAmount: 45000,   // ₱450.00
          commission: 2700,     // ₱27.00
          laborFee: 2500,       // ₱25.00
          netAmount: 39800,     // ₱398.00
          createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          id: "txn3",
          transactionNumber: "TXN-20250902-003",
          lotNumber: "LOT-20250902-003",
          fishType: "Yellowfin Tuna",
          supplierName: "Pacific Tuna Co.",
          buyerName: "Sushi Master Restaurant",
          grossAmount: 37200,   // ₱372.00
          commission: 2232,     // ₱22.32
          laborFee: 2500,       // ₱25.00
          netAmount: 32468,     // ₱324.68
          createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        }
      ]

      const mockSettlements = [
        {
          id: "set1",
          settlementNumber: "SET-20250902-001",
          supplierName: "Atlantic Fisheries",
          amount: 61232,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          completedAt: null
        },
        {
          id: "set2",
          settlementNumber: "SET-20250902-002",
          supplierName: "Gulf Coast Fishing",
          amount: 39800,
          status: "COMPLETED",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
        },
        {
          id: "set3",
          settlementNumber: "SET-20250902-003",
          supplierName: "Pacific Tuna Co.",
          amount: 32468,
          status: "PENDING",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          completedAt: null
        }
      ]

      const reportData: DailyReportData = {
        date,
        summary: mockSummary,
        transactions: mockTransactions,
        settlements: mockSettlements
      }

      return {
        success: true,
        data: reportData
      }
    }

    // For other dates, try to fetch from database (will be empty in mock environment)
    // Parse date and create date range for the full day
    const targetDate = new Date(date)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Fetch transactions for the date
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        },
        type: 'SALE'
      },
      include: {
        lot: {
          include: {
            supplier: {
              include: {
                user: true
              }
            }
          }
        },
        user: true, // This is the buyer
        settlement: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Fetch settlements for the date
    const settlements = await prisma.settlement.findMany({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        user: true, // This is the supplier
        transaction: {
          include: {
            lot: {
              include: {
                supplier: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate summary statistics
    const summary = {
      totalTransactions: transactions.length,
      totalGrossAmount: transactions.reduce((sum, t) => sum + (t.saleAmount || 0), 0),
      totalCommissions: transactions.reduce((sum, t) => sum + (t.commission || 0), 0),
      totalLaborFees: transactions.reduce((sum, t) => sum + (t.laborFee || 0), 0),
      totalNetAmount: transactions.reduce((sum, t) => sum + (t.netAmount || 0), 0),
      totalSettlements: settlements.length,
      pendingSettlements: settlements.filter(s => s.status === 'PENDING').length,
      completedSettlements: settlements.filter(s => s.status === 'COMPLETED').length,
      pendingAmount: settlements
        .filter(s => s.status === 'PENDING')
        .reduce((sum, s) => sum + s.amount, 0),
      completedAmount: settlements
        .filter(s => s.status === 'COMPLETED')
        .reduce((sum, s) => sum + s.amount, 0)
    }

    // Format transaction data
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      transactionNumber: transaction.transactionNumber,
      lotNumber: transaction.lot?.lotNumber || 'N/A',
      fishType: transaction.lot?.fishType || 'N/A',
      supplierName: transaction.lot?.supplier?.user?.name || 'N/A',
      buyerName: transaction.user?.name || transaction.user?.email || 'N/A',
      grossAmount: transaction.saleAmount || 0,
      commission: transaction.commission || 0,
      laborFee: transaction.laborFee || 0,
      netAmount: transaction.netAmount || 0,
      createdAt: transaction.createdAt.toISOString()
    }))

    // Format settlement data
    const formattedSettlements = settlements.map(settlement => ({
      id: settlement.id,
      settlementNumber: settlement.settlementNumber,
      supplierName: settlement.user?.name || settlement.user?.email || 'N/A',
      amount: settlement.amount,
      status: settlement.status,
      createdAt: settlement.createdAt.toISOString(),
      completedAt: settlement.completedAt?.toISOString() || null
    }))

    const reportData: DailyReportData = {
      date,
      summary,
      transactions: formattedTransactions,
      settlements: formattedSettlements
    }

    return {
      success: true,
      data: reportData
    }

  } catch (error) {
    console.error("Error generating daily report:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate daily report" 
    }
  }
}

export async function exportDailyReportCSV(date: string): Promise<ActionResult & { data?: string }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'BROKER') {
      return { success: false, error: "Unauthorized: Only brokers can export reports" }
    }

    // Get the report data
    const reportResult = await getDailyReport(date)
    
    if (!reportResult.success || !reportResult.data) {
      return { success: false, error: "Failed to fetch report data" }
    }

    const { transactions, settlements, summary } = reportResult.data

    // Create CSV content
    const csvLines: string[] = []
    
    // Header information
    csvLines.push(`"Daily Report for ${date}"`)
    csvLines.push(`"Generated on ${new Date().toISOString()}"`)
    csvLines.push(`"Generated by ${session.user.name || session.user.email}"`)
    csvLines.push('') // Empty line
    
    // Summary section
    csvLines.push('"SUMMARY"')
    csvLines.push('"Metric","Value"')
    csvLines.push(`"Total Transactions","${summary.totalTransactions}"`)
    csvLines.push(`"Total Gross Amount","${(summary.totalGrossAmount / 100).toFixed(2)}"`)
    csvLines.push(`"Total Commissions","${(summary.totalCommissions / 100).toFixed(2)}"`)
    csvLines.push(`"Total Labor Fees","${(summary.totalLaborFees / 100).toFixed(2)}"`)
    csvLines.push(`"Total Net Amount","${(summary.totalNetAmount / 100).toFixed(2)}"`)
    csvLines.push(`"Total Settlements","${summary.totalSettlements}"`)
    csvLines.push(`"Pending Settlements","${summary.pendingSettlements}"`)
    csvLines.push(`"Completed Settlements","${summary.completedSettlements}"`)
    csvLines.push(`"Pending Amount","${(summary.pendingAmount / 100).toFixed(2)}"`)
    csvLines.push(`"Completed Amount","${(summary.completedAmount / 100).toFixed(2)}"`)
    csvLines.push('') // Empty line
    
    // Transactions section
    csvLines.push('"TRANSACTIONS"')
    csvLines.push('"Transaction Number","Lot Number","Fish Type","Supplier","Buyer","Gross Amount","Commission","Labor Fee","Net Amount","Created At"')
    
    transactions.forEach(transaction => {
      csvLines.push([
        `"${transaction.transactionNumber}"`,
        `"${transaction.lotNumber}"`,
        `"${transaction.fishType}"`,
        `"${transaction.supplierName}"`,
        `"${transaction.buyerName}"`,
        `"${(transaction.grossAmount / 100).toFixed(2)}"`,
        `"${(transaction.commission / 100).toFixed(2)}"`,
        `"${(transaction.laborFee / 100).toFixed(2)}"`,
        `"${(transaction.netAmount / 100).toFixed(2)}"`,
        `"${new Date(transaction.createdAt).toLocaleString()}"`
      ].join(','))
    })
    
    csvLines.push('') // Empty line
    
    // Settlements section
    csvLines.push('"SETTLEMENTS"')
    csvLines.push('"Settlement Number","Supplier","Amount","Status","Created At","Completed At"')
    
    settlements.forEach(settlement => {
      csvLines.push([
        `"${settlement.settlementNumber}"`,
        `"${settlement.supplierName}"`,
        `"${(settlement.amount / 100).toFixed(2)}"`,
        `"${settlement.status}"`,
        `"${new Date(settlement.createdAt).toLocaleString()}"`,
        `"${settlement.completedAt ? new Date(settlement.completedAt).toLocaleString() : 'N/A'}"`
      ].join(','))
    })

    const csvContent = csvLines.join('\n')

    return {
      success: true,
      data: csvContent
    }

  } catch (error) {
    console.error("Error generating CSV export:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to generate CSV export" 
    }
  }
}
