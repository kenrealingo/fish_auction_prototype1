import { PrismaClient } from '@prisma/client'
import { logger } from './logger'
import { AuditEventType } from '../types/audit'

const prisma = new PrismaClient()

export interface AuditContext {
  performedBy?: string
  affectedUserId?: string
  requestId?: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

export interface AuditData {
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
}

class AuditLogger {
  private static instance: AuditLogger

  constructor() {
    if (AuditLogger.instance) {
      return AuditLogger.instance
    }
    AuditLogger.instance = this
  }

  async logEvent(
    eventType: AuditEventType,
    resource: string,
    action: string,
    context: AuditContext,
    data?: AuditData,
    resourceId?: string
  ): Promise<void> {
    try {
      const auditEvent = await (prisma as any).auditEvent.create({
        data: {
          eventType,
          resource,
          resourceId,
          action,
          performedBy: context.performedBy,
          affectedUserId: context.affectedUserId,
          requestId: context.requestId,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          oldValues: data?.oldValues || null,
          newValues: data?.newValues || null,
          metadata: context.metadata || null,
          success: true,
        },
      })

      // Also log to application logger
      logger.auditEvent(`${eventType}: ${action}`, resource, {
        requestId: context.requestId,
        userId: context.performedBy,
        metadata: {
          auditEventId: auditEvent.id,
          resourceId,
          affectedUserId: context.affectedUserId,
          ...context.metadata,
        },
      })
    } catch (error) {
      // If audit logging fails, we should still log the error but not fail the main operation
      logger.error('Failed to create audit event', {
        requestId: context.requestId,
        metadata: {
          eventType,
          resource,
          action,
          resourceId,
          error,
        },
      })

      // Try to create a failed audit event
      try {
        await (prisma as any).auditEvent.create({
          data: {
            eventType,
            resource,
            resourceId,
            action,
            performedBy: context.performedBy,
            affectedUserId: context.affectedUserId,
            requestId: context.requestId,
            success: false,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            metadata: context.metadata || null,
          },
        })
      } catch (secondaryError) {
        logger.error('Failed to create failed audit event', {
          requestId: context.requestId,
          metadata: { secondaryError },
        })
      }
    }
  }

  // Convenience methods for common audit events
  async logLotCreated(
    lotId: string,
    lotData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.LOT_CREATED,
      'lot',
      'create',
      context,
      { newValues: lotData },
      lotId
    )
  }

  async logLotUpdated(
    lotId: string,
    oldData: Record<string, any>,
    newData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.LOT_UPDATED,
      'lot',
      'update',
      context,
      { oldValues: oldData, newValues: newData },
      lotId
    )
  }

  async logAuctionStarted(
    auctionId: string,
    auctionData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.AUCTION_STARTED,
      'auction',
      'start',
      context,
      { newValues: auctionData },
      auctionId
    )
  }

  async logAuctionClosed(
    auctionId: string,
    auctionData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.AUCTION_CLOSED,
      'auction',
      'close',
      context,
      { newValues: auctionData },
      auctionId
    )
  }

  async logBidPlaced(
    bidId: string,
    bidData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.BID_PLACED,
      'bid',
      'place',
      context,
      { newValues: bidData },
      bidId
    )
  }

  async logTransactionCreated(
    transactionId: string,
    transactionData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.TRANSACTION_CREATED,
      'transaction',
      'create',
      context,
      { newValues: transactionData },
      transactionId
    )
  }

  async logSettlementCreated(
    settlementId: string,
    settlementData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.SETTLEMENT_CREATED,
      'settlement',
      'create',
      context,
      { newValues: settlementData },
      settlementId
    )
  }

  async logUserCreated(
    userId: string,
    userData: Record<string, any>,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.USER_CREATED,
      'user',
      'create',
      context,
      { newValues: userData },
      userId
    )
  }

  async logLoginSuccess(
    userId: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.LOGIN_SUCCESS,
      'auth',
      'login',
      { ...context, affectedUserId: userId },
      undefined,
      userId
    )
  }

  async logLoginFailed(
    email: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.LOGIN_FAILED,
      'auth',
      'login_failed',
      context,
      { newValues: { email } }
    )
  }

  async logPermissionDenied(
    resource: string,
    action: string,
    context: AuditContext
  ): Promise<void> {
    await this.logEvent(
      AuditEventType.PERMISSION_DENIED,
      resource,
      `permission_denied_${action}`,
      context,
      { newValues: { attemptedAction: action } }
    )
  }

  // Utility method to get audit context from request
  static getAuditContext(
    req: any,
    userId?: string,
    affectedUserId?: string
  ): AuditContext {
    return {
      performedBy: userId,
      affectedUserId,
      requestId: logger.getRequestId(),
      ipAddress: req?.ip || req?.connection?.remoteAddress || 'unknown',
      userAgent: req?.headers?.['user-agent'] || 'unknown',
    }
  }

  // Method to clean up old audit events (call from a scheduled job)
  async cleanupOldEvents(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await (prisma as any).auditEvent.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    logger.info(`Cleaned up ${result.count} old audit events`, {
      metadata: { cutoffDate, daysToKeep },
    })

    return result.count
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger()

// Export utility functions
export async function withAudit<T>(
  eventType: AuditEventType,
  resource: string,
  action: string,
  context: AuditContext,
  operation: () => Promise<T>,
  getAuditData?: (result: T) => AuditData
): Promise<T> {
  try {
    const result = await operation()
    
    const auditData = getAuditData ? getAuditData(result) : undefined
    await auditLogger.logEvent(eventType, resource, action, context, auditData)
    
    return result
  } catch (error) {
    // Log failed operation
    await auditLogger.logEvent(
      eventType,
      resource,
      `${action}_failed`,
      context,
      { newValues: { error: error instanceof Error ? error.message : 'Unknown error' } }
    )
    throw error
  }
}
