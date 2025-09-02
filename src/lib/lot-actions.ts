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

interface CreateLotData {
  fishType: string
  fishSpecies?: string
  weight: number
  grade?: string
  freshness?: string
  origin?: string
  reservePrice?: number
  description?: string
  caughtAt?: Date
}

export async function createLot(supplierId: string, lotData: CreateLotData): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('createLot', { 
      requestId,
      metadata: { supplierId, fishType: lotData.fishType, weight: lotData.weight }
    })

    const session = await getServerSession(authOptions) as CustomSession
    
    if (!session?.user) {
      return { success: false, error: "Unauthorized: Please log in" }
    }

    // Check if user has permission to create lots (BROKER or SUPPLIER)
    if (!['BROKER', 'SUPPLIER'].includes(session.user.role)) {
      await auditLogger.logPermissionDenied('lot', 'create', {
        performedBy: session.user.id,
        requestId,
      })
      return { success: false, error: "Unauthorized: Only brokers and suppliers can create lots" }
    }

    // Use Prisma transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Verify supplier exists
      const supplier = await tx.supplier.findUnique({
        where: { id: supplierId }
      })

      if (!supplier) {
        throw new Error("Supplier not found")
      }

      // If user is a supplier, they can only create lots for themselves
      if (session.user!.role === 'SUPPLIER') {
        const userSupplier = await tx.supplier.findUnique({
          where: { userId: session.user!.id }
        })
        
        if (!userSupplier || userSupplier.id !== supplierId) {
          throw new Error("Suppliers can only create lots for themselves")
        }
      }

      // Generate lot number
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const lotCount = await tx.catchLot.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
      const lotNumber = `LOT-${today}-${String(lotCount + 1).padStart(3, '0')}`

      // Create the lot
      const lot = await tx.catchLot.create({
        data: {
          lotNumber,
          supplierId,
          fishType: lotData.fishType,
          fishSpecies: lotData.fishSpecies,
          weight: lotData.weight,
          grade: lotData.grade,
          freshness: lotData.freshness,
          origin: lotData.origin,
          status: LotStatus.AVAILABLE,
          reservePrice: lotData.reservePrice,
          description: lotData.description,
          caughtAt: lotData.caughtAt,
          // createdBy: session.user!.id, // Will add when schema is updated
          // updatedBy: session.user!.id,
        }
      })

      return lot
    })

    // Log successful lot creation
    await auditLogger.logLotCreated(result.id, {
      lotNumber: result.lotNumber,
      supplierId: result.supplierId,
      fishType: result.fishType,
      weight: result.weight,
      grade: result.grade,
      freshness: result.freshness,
      status: result.status,
      reservePrice: result.reservePrice,
    }, {
      performedBy: session.user!.id,
      affectedUserId: supplierId, // The supplier who owns the lot
      requestId,
    })

    logger.info('Lot created successfully', {
      requestId,
      userId: session.user!.id,
      metadata: { 
        lotId: result.id,
        lotNumber: result.lotNumber,
        supplierId: result.supplierId,
        fishType: result.fishType,
        weight: result.weight
      }
    })

    return { success: true, data: result }
  } catch (error) {
    logger.error("Error creating lot", {
      requestId,
      metadata: { supplierId, lotData, error }
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create lot" 
    }
  }
}

// Example of how to create a transaction with audit logging
export async function createTransaction(
  lotId: string,
  bidId: string,
  userId: string,
  transactionData: {
    type: 'SALE' | 'COMMISSION' | 'LABOR_FEE'
    amount: number
    description?: string
    saleAmount?: number
    commission?: number
    laborFee?: number
    netAmount?: number
  }
): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('createTransaction', { 
      requestId,
      metadata: { lotId, bidId, userId, type: transactionData.type, amount: transactionData.amount }
    })

    const session = await getServerSession(authOptions) as CustomSession
    
    if (!session?.user || session.user.role !== 'BROKER') {
      await auditLogger.logPermissionDenied('transaction', 'create', {
        performedBy: session?.user?.id,
        requestId,
      })
      return { success: false, error: "Unauthorized: Only brokers can create transactions" }
    }

    // Use Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // Generate transaction number
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const txnCount = await tx.transaction.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
      const transactionNumber = `TXN-${today}-${String(txnCount + 1).padStart(3, '0')}`

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          transactionNumber,
          lotId,
          bidId,
          userId,
          type: transactionData.type,
          amount: transactionData.amount,
          description: transactionData.description,
          saleAmount: transactionData.saleAmount,
          commission: transactionData.commission,
          laborFee: transactionData.laborFee,
          netAmount: transactionData.netAmount,
          // createdBy: session.user!.id, // Will add when schema is updated
          // updatedBy: session.user!.id,
        }
      })

      return transaction
    })

    // Log successful transaction creation
    await auditLogger.logTransactionCreated(result.id, {
      transactionNumber: result.transactionNumber,
      lotId: result.lotId,
      bidId: result.bidId,
      userId: result.userId,
      type: result.type,
      amount: result.amount,
      saleAmount: result.saleAmount,
      commission: result.commission,
      laborFee: result.laborFee,
      netAmount: result.netAmount,
    }, {
      performedBy: session.user!.id,
      affectedUserId: userId, // The user affected by the transaction
      requestId,
    })

    logger.info('Transaction created successfully', {
      requestId,
      userId: session.user!.id,
      metadata: { 
        transactionId: result.id,
        transactionNumber: result.transactionNumber,
        type: result.type,
        amount: result.amount,
        affectedUserId: userId
      }
    })

    return { success: true, data: result }
  } catch (error) {
    logger.error("Error creating transaction", {
      requestId,
      metadata: { lotId, bidId, userId, transactionData, error }
    })
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to create transaction" 
    }
  }
}
