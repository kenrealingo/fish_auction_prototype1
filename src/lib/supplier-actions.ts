"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface SupplierTotals {
  lifetimeGross: number        // Total sale amounts
  totalCommissions: number     // Total commissions paid
  totalLaborFees: number       // Total labor fees paid
  netPayouts: number           // Total net payouts to supplier
  transactionCount: number     // Number of transactions
  settledAmount: number        // Amount that has been settled
  pendingAmount: number        // Amount pending settlement
}

interface ActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function getSupplierTotals(supplierUserId: string): Promise<ActionResult & { data?: SupplierTotals }> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    // Check if user can access this supplier's data
    if (session.user.role !== 'BROKER' && session.user.id !== supplierUserId) {
      return { success: false, error: "Unauthorized: Can only view your own supplier data" }
    }

    // Get all transactions for lots owned by this supplier
    const transactions = await prisma.transaction.findMany({
      where: {
        lot: {
          supplier: {
            userId: supplierUserId
          }
        },
        type: 'SALE'
      },
      include: {
        settlement: true,
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
    })

    // Calculate totals
    const totals: SupplierTotals = transactions.reduce(
      (acc, transaction) => ({
        lifetimeGross: acc.lifetimeGross + (transaction.saleAmount || 0),
        totalCommissions: acc.totalCommissions + (transaction.commission || 0),
        totalLaborFees: acc.totalLaborFees + (transaction.laborFee || 0),
        netPayouts: acc.netPayouts + (transaction.netAmount || 0),
        transactionCount: acc.transactionCount + 1,
        settledAmount: acc.settledAmount + (
          transaction.settlement?.status === 'COMPLETED' ? (transaction.netAmount || 0) : 0
        ),
        pendingAmount: acc.pendingAmount + (
          transaction.settlement?.status === 'PENDING' ? (transaction.netAmount || 0) : 0
        )
      }),
      {
        lifetimeGross: 0,
        totalCommissions: 0,
        totalLaborFees: 0,
        netPayouts: 0,
        transactionCount: 0,
        settledAmount: 0,
        pendingAmount: 0
      }
    )

    return {
      success: true,
      data: totals
    }
  } catch (error) {
    console.error("Error fetching supplier totals:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch supplier totals" 
    }
  }
}

export async function getAllSuppliers(): Promise<ActionResult> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'BROKER') {
      return { success: false, error: "Unauthorized: Only brokers can view all suppliers" }
    }

    const suppliers = await prisma.supplier.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        lots: {
          select: {
            id: true,
            status: true
          }
        }
      }
    })

    return {
      success: true,
      data: suppliers
    }
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch suppliers" 
    }
  }
}
