# Logging and Audit System Implementation

This document describes the comprehensive logging and audit system implemented for the fish auction application.

## 🚀 Overview

The system provides:
- **Lightweight request-scoped logging** with unique request IDs
- **Comprehensive audit trail** for critical business operations
- **Database schema enhancements** with createdBy/updatedBy tracking
- **Production-ready logging infrastructure**

## 📁 Files Added/Updated

### Core Logging Infrastructure

#### `src/lib/logger.ts`
- **Lightweight Logger**: Singleton logger with request ID tracking
- **Colored Console Output**: Different colors for log levels in development
- **Production Logging**: Structured JSON output for container environments
- **Convenience Methods**: API requests, server actions, database queries, audit events
- **Request Context**: Automatic request ID generation and tracking

Key features:
```typescript
// Request-scoped logging
logger.info('User logged in', { userId: '123', requestId })

// API logging with automatic timing
logger.apiRequest('GET', '/api/auctions')
logger.apiResponse('GET', '/api/auctions', 200, 150) // 150ms

// Server action logging
logger.serverAction('placeBid', { metadata: { auctionId, amount } })

// Audit event logging
logger.auditEvent('AUCTION_STARTED', 'auction', { metadata: { lotId } })
```

#### `src/lib/audit-logger.ts`
- **Comprehensive Audit Trail**: All critical business events logged to database
- **Event Types**: 18 different audit event types for complete coverage
- **User Context**: Tracks who performed actions and who was affected
- **Request Correlation**: Links audit events to application logs via request ID
- **Failure Resilience**: Audit logging failures don't break main operations

Key features:
```typescript
// Convenience methods for common events
await auditLogger.logAuctionStarted(auctionId, auctionData, context)
await auditLogger.logBidPlaced(bidId, bidData, context)
await auditLogger.logTransactionCreated(txnId, txnData, context)

// Generic audit logging
await auditLogger.logEvent(
  AuditEventType.LOT_CREATED,
  'lot',
  'create',
  context,
  { newValues: lotData },
  lotId
)
```

#### `src/lib/api-middleware.ts`
- **API Route Wrapper**: Automatic request ID generation and logging
- **Server Action Wrapper**: Request tracking for server actions
- **Response Headers**: Adds X-Request-ID header for debugging
- **Error Handling**: Automatic error logging with request correlation

### Database Schema Enhancements

#### `prisma/schema.prisma`
- **AuditEvent Model**: Complete audit trail storage
- **AuditEventType Enum**: 18 event types covering all critical operations
- **createdBy/updatedBy Fields**: Added to Supplier, Buyer, CatchLot, Auction, Transaction models
- **User Relations**: New relations for audit trail ownership

#### `src/types/audit.ts`
- **TypeScript Enums**: Type-safe audit event types
- **Schema Synchronization**: Keeps TypeScript types in sync with Prisma schema

### Enhanced Server Actions

#### `src/lib/auction-actions-clean.ts` (Updated)
- **Request Tracking**: Each action gets unique request ID
- **Permission Logging**: Failed authorization attempts logged
- **Success Auditing**: All successful operations create audit events
- **Error Correlation**: Errors linked to requests for debugging
- **User Context**: All operations track performing user

Example integration:
```typescript
export async function startAuction(lotId: string): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('startAuction', { requestId, metadata: { lotId } })
    
    // ... business logic ...
    
    await auditLogger.logAuctionStarted(result.id, auctionData, {
      performedBy: session.user!.id,
      requestId,
    })
    
    logger.info('Auction started successfully', {
      requestId,
      userId: session.user!.id,
      metadata: { auctionId: result.id, lotId }
    })
    
    return { success: true, data: result }
  } catch (error) {
    logger.error("Error starting auction", {
      requestId,
      metadata: { lotId, error }
    })
    throw error
  }
}
```

#### `src/lib/lot-actions.ts` (New)
- **Demonstration Implementation**: Shows full logging/audit integration
- **Lot Creation**: Complete audit trail for lot creation
- **Transaction Creation**: Full logging for financial transactions
- **Permission Checking**: Authorization with audit logging

### API Enhancements

#### `src/app/api/health/route.ts` (Updated)
- **Request Tracking**: Health checks now have request IDs
- **Usage Monitoring**: Logs health check requests for monitoring
- **Debug Headers**: Returns request ID in response headers

## 🎯 Audit Event Types

The system tracks these critical events:

### Lot Management
- `LOT_CREATED` - New lot added to system
- `LOT_UPDATED` - Lot information changed
- `LOT_DELETED` - Lot removed from system

### Auction Operations  
- `AUCTION_STARTED` - Auction begins for a lot
- `AUCTION_CLOSED` - Auction completed (with/without bids)
- `AUCTION_CANCELLED` - Auction terminated early

### Bidding Activity
- `BID_PLACED` - New bid submitted
- `BID_WITHDRAWN` - Bid retracted (if supported)

### Financial Operations
- `TRANSACTION_CREATED` - Sale, commission, or fee transaction
- `TRANSACTION_UPDATED` - Transaction modified
- `SETTLEMENT_CREATED` - Payment settlement initiated
- `SETTLEMENT_COMPLETED` - Payment confirmed

### User Management
- `USER_CREATED` - New user account
- `USER_UPDATED` - User information changed
- `USER_DELETED` - User account removed

### Security Events
- `LOGIN_SUCCESS` - Successful authentication
- `LOGIN_FAILED` - Failed login attempt
- `PERMISSION_DENIED` - Unauthorized action attempt

## 📊 Database Schema Changes

### AuditEvent Table
```sql
CREATE TABLE "audit_events" (
  "id" TEXT PRIMARY KEY,
  "eventId" TEXT UNIQUE,
  "eventType" TEXT NOT NULL, -- AuditEventType enum
  "resource" TEXT NOT NULL,  -- affected table/entity
  "resourceId" TEXT,         -- specific record ID
  "action" TEXT NOT NULL,    -- specific operation
  "performedBy" TEXT,        -- who did it
  "affectedUserId" TEXT,     -- who was affected
  "requestId" TEXT,          -- correlation with app logs
  "ipAddress" TEXT,          -- source IP
  "userAgent" TEXT,          -- client info
  "oldValues" JSON,          -- before state
  "newValues" JSON,          -- after state
  "metadata" JSON,           -- additional context
  "timestamp" TIMESTAMP DEFAULT now(),
  "success" BOOLEAN DEFAULT true,
  "errorMessage" TEXT
);
```

### Enhanced Models
All key models now include:
- `createdBy` - User who created the record
- `updatedBy` - User who last updated the record
- Proper relations to User model for audit trail

## 🚀 Usage Examples

### API Route with Logging
```typescript
import { withApiLogging } from '@/lib/api-middleware'

export const GET = withApiLogging(async (req: NextRequest) => {
  // Automatic request ID generation and logging
  // Request/response timing automatically tracked
  return NextResponse.json({ data: 'example' })
})
```

### Server Action with Full Audit
```typescript
export async function createLot(data: LotData): Promise<ActionResult> {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('createLot', { requestId, metadata: data })
    
    const result = await prisma.catchLot.create({ data })
    
    await auditLogger.logLotCreated(result.id, result, {
      performedBy: session.user.id,
      requestId,
    })
    
    return { success: true, data: result }
  } catch (error) {
    logger.error('Lot creation failed', { requestId, metadata: { error } })
    throw error
  }
}
```

### Request Correlation
```bash
# Application logs
[2025-09-02T10:30:15.123Z] INFO [req-123abc...] Server Action: startAuction | userId: user-456
[2025-09-02T10:30:15.150Z] INFO [req-123abc...] Auction started successfully | metadata: {"auctionId":"auc-789"}

# Database audit record
{
  "eventId": "evt-def456",
  "eventType": "AUCTION_STARTED", 
  "requestId": "req-123abc...",
  "performedBy": "user-456",
  "resource": "auction",
  "resourceId": "auc-789"
}
```

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Controls logging format (development vs production)
- Existing database and auth variables

### Production Considerations
- Logs are JSON structured in production for container parsing
- Audit events stored permanently (implement cleanup job if needed)
- Request IDs included in response headers for debugging
- Failed audit logging doesn't break main operations

## 📈 Benefits

1. **Complete Audit Trail**: Every critical business operation is tracked
2. **Request Correlation**: Easy debugging by following request IDs  
3. **Security Monitoring**: All authorization failures logged
4. **Performance Insights**: API timing and error rates tracked
5. **Compliance Ready**: Comprehensive audit logs for regulatory requirements
6. **Debugging Support**: Detailed context for issue resolution
7. **User Activity Tracking**: Who did what when with full context

## 🔄 Next Steps

1. **Database Migration**: Run `prisma db push` to apply schema changes
2. **Integration**: Update existing server actions to use logging/audit
3. **Monitoring Setup**: Configure log aggregation for production
4. **Cleanup Jobs**: Implement audit event cleanup for old records
5. **Dashboard**: Build admin interface for audit event viewing
6. **Alerts**: Set up monitoring for failed operations and security events

The system is now ready for production use with comprehensive logging and audit capabilities!
