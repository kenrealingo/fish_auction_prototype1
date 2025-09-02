# Fish Auction System - Project Specification

**Version**: 1.0.0  
**Last Updated**: September 2, 2025  
**Status**: Production Ready  

> **📋 Documentation Principle**: This project follows the "one file to rule them all" approach - this single `spec.md` file contains ALL project documentation, requirements, schemas, APIs, tests, and implementation details. This ensures consistency and prevents documentation fragmentation.

## Project Overview

A comprehensive fish auction platform built for the Philippine market, enabling suppliers, buyers, and brokers to conduct transparent fish auctions with real-time bidding, financial settlements, and regulatory compliance.

## Scope & Rules

### Core Functionality
- **Multi-role system**: Suppliers (fishermen), Buyers (retailers/processors), Brokers (auctioneers)
- **Auction lifecycle**: Lot creation → Auction scheduling → Bidding → Settlement
- **Philippine Peso currency**: All transactions in ₱ with centavos precision
- **Real-time bidding**: Time-bound auctions with minimum bids and increments
- **Financial tracking**: Commission calculation, labor fees, and automated settlements
- **Regulatory compliance**: Tax ID tracking, license validation, vessel registration

### Business Rules

#### User Management
- Each user has ONE role: SUPPLIER, BUYER, or BROKER
- All users require: email, name, phone, address, tax ID, bank account
- Suppliers require: fishing license, vessel name/number, fishing area
- Buyers require: business registration, credit limit validation
- Brokers manage auctions and facilitate transactions

#### Auction Rules
- Auctions have defined start/end times and status (open/closed)
- Only OPEN auctions accept bids during their time window
- Minimum bid must be met before bidding begins
- Bid increments must be followed (default: ₱5.00)
- Winning bid is highest valid bid when auction closes
- No bid modifications after submission (immutable)

#### Financial Rules
- All amounts stored in centavos to avoid floating-point errors
- Commission: 6% of winning bid (configurable)
- Labor fee: ₱25.00 flat fee per lot (configurable)
- Settlement calculation: `winning_bid - commission - labor_fee = net_to_supplier`
- Payments processed within 48 hours of auction close
- All financial records immutable once created

#### Data Validation
- Fish weights: 0.1kg minimum, 1000kg maximum
- Bid amounts: ₱10.00 minimum, ₱1,000,000 maximum
- Phone numbers: Philippine format (+63-xxx-xxx-xxxx)
- Email addresses: RFC 5322 compliant
- Dates: Future dates only for auction scheduling
- Required fields: No null values for core business data

### Technical Constraints
- **Currency precision**: All money calculations in centavos (integer math)
- **Type safety**: TypeScript with strict mode, Zod validation schemas
- **Database**: PostgreSQL with Prisma ORM, foreign key constraints
- **Performance**: Sub-3s page loads, <100ms API responses
- **Security**: HTTPS only, input sanitization, SQL injection prevention
- **Scalability**: Horizontal scaling ready, stateless application design

## Database Schema

```sql
-- Users table (polymorphic design)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('SUPPLIER', 'BUYER', 'BROKER')),
    business_name TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    tax_id TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers (fishermen/fishing companies)
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    license_number TEXT UNIQUE NOT NULL,
    vessel_name TEXT NOT NULL,
    vessel_number TEXT UNIQUE NOT NULL,
    fishing_area TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Buyers (fish retailers/processors)
CREATE TABLE buyers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    business_registration TEXT UNIQUE NOT NULL,
    credit_limit_cents INTEGER DEFAULT 0,
    current_outstanding_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Fish catch lots
CREATE TABLE catch_lots (
    id TEXT PRIMARY KEY,
    lot_number TEXT UNIQUE NOT NULL,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE RESTRICT,
    fish_type TEXT NOT NULL,
    species TEXT NOT NULL,
    weight_kg DECIMAL(10,2) NOT NULL CHECK (weight_kg > 0),
    quality_grade TEXT NOT NULL CHECK (quality_grade IN ('A', 'B', 'C')),
    catch_date DATE NOT NULL,
    storage_location TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('drafted', 'listed', 'bidding', 'pending_supplier_approval', 'approved', 'rejected', 'sold', 'canceled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Auctions
CREATE TABLE auctions (
    id TEXT PRIMARY KEY,
    auction_number TEXT UNIQUE NOT NULL,
    lot_id TEXT REFERENCES catch_lots(id) ON DELETE RESTRICT,
    broker_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    minimum_bid_cents INTEGER NOT NULL CHECK (minimum_bid_cents >= 1000),
    bid_increment_cents INTEGER DEFAULT 500 CHECK (bid_increment_cents > 0),
    current_highest_bid_cents INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('open', 'closed')),
    total_bids INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bids
CREATE TABLE bids (
    id TEXT PRIMARY KEY,
    bid_number TEXT UNIQUE NOT NULL,
    auction_id TEXT REFERENCES auctions(id) ON DELETE RESTRICT,
    lot_id TEXT REFERENCES catch_lots(id) ON DELETE RESTRICT,
    bidder_id TEXT REFERENCES buyers(id) ON DELETE RESTRICT,
    buyer_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    is_winning BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Financial settlements
CREATE TABLE settlements (
    id TEXT PRIMARY KEY,
    settlement_number TEXT UNIQUE NOT NULL,
    user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    transaction_id TEXT NOT NULL,
    gross_amount_cents INTEGER NOT NULL,
    commission_cents INTEGER NOT NULL,
    labor_fee_cents INTEGER NOT NULL,
    net_to_supplier_cents INTEGER NOT NULL,
    amount INTEGER NOT NULL, -- Total settlement amount
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Transactions (financial records)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    transaction_number TEXT UNIQUE NOT NULL,
    auction_id TEXT REFERENCES auctions(id) ON DELETE RESTRICT,
    buyer_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    supplier_user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
    amount_cents INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Daily reports
CREATE TABLE daily_reports (
    id TEXT PRIMARY KEY,
    report_date DATE UNIQUE NOT NULL,
    total_auctions INTEGER DEFAULT 0,
    total_revenue_cents INTEGER DEFAULT 0,
    total_commission_cents INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- NextAuth.js tables (authentication)
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    session_token TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_catch_lots_supplier ON catch_lots(supplier_id);
CREATE INDEX idx_catch_lots_status ON catch_lots(status);
CREATE INDEX idx_auctions_start_time ON auctions(start_time);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_amount ON bids(amount_cents DESC);
```

## API Specifications

### Core Endpoints

#### Health Check
```
GET /api/health
Response: {
  ok: boolean,
  timestamp: string,
  environment: string,
  version: string
}
```

#### User Management
```
POST /api/users/register
Body: { email, name, password, role, businessName, phone, address, taxId, bankAccount }
Response: { success: boolean, user: User }

POST /api/auth/signin
Body: { email, password }
Response: { success: boolean, token: string }
```

#### Auction Operations
```
GET /api/auctions/active
Response: { auctions: Auction[] }

POST /api/auctions/{id}/bid
Body: { amount: number }
Response: { success: boolean, bid: Bid }

GET /api/auctions/{id}/status
Response: { auction: Auction, bids: Bid[] }
```

#### Financial Operations
```
GET /api/settlements/user/{id}
Response: { settlements: Settlement[] }

POST /api/settlements/calculate
Body: { auctionId: string }
Response: { settlement: Settlement }
```

### Data Models (TypeScript)

```typescript
// Core Types
export type UserRole = 'SUPPLIER' | 'BUYER' | 'BROKER'
export type AuctionStatus = 'open' | 'closed'
export type LotStatus = 'drafted' | 'listed' | 'bidding' | 'pending_supplier_approval' | 'approved' | 'rejected' | 'sold' | 'canceled'

// User Entity
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  businessName?: string
  phone: string
  address: string
  taxId: string
  bankAccount: string
  createdAt: Date
}

// Supplier Entity
export interface Supplier {
  id: string
  userId: string
  licenseNumber: string
  vesselName: string
  vesselNumber: string
  fishingArea: string
  user?: User
}

// Lot Entity
export interface CatchLot {
  id: string
  lotNumber: string
  supplierId: string
  fishType: string
  species: string
  weightKg: number
  qualityGrade: 'A' | 'B' | 'C'
  catchDate: Date
  storageLocation: string
  status: LotStatus
  supplier?: Supplier
}

// Auction Entity
export interface Auction {
  id: string
  auctionNumber: string
  lotId: string
  brokerUserId: string
  startTime: Date
  endTime: Date
  minimumBidCents: number
  bidIncrementCents: number
  currentHighestBidCents: number
  status: AuctionStatus
  totalBids: number
  lot?: CatchLot
  bids?: Bid[]
}

// Bid Entity
export interface Bid {
  id: string
  bidNumber: string
  auctionId: string
  lotId: string
  bidderId: string
  buyerUserId: string
  amountCents: number
  isWinning: boolean
  createdAt: Date
}

// Settlement Entity
export interface Settlement {
  id: string
  settlementNumber: string
  userId: string
  transactionId: string
  grossAmountCents: number
  commissionCents: number
  laborFeeCents: number
  netToSupplierCents: number
  amount: number
  status: 'PENDING' | 'COMPLETED' | 'FAILED'
  notes?: string
}
```

## Acceptance Tests

### User Registration & Authentication
```gherkin
Feature: User Registration
  Scenario: Supplier Registration
    Given I am on the registration page
    When I fill in supplier details with valid fishing license
    And I submit the registration form
    Then I should be registered as a supplier
    And I should receive a confirmation email
    
  Scenario: Invalid Role Registration
    Given I am on the registration page
    When I try to register without selecting a role
    Then I should see a validation error
    And registration should not proceed
```

### Auction Lifecycle
```gherkin
Feature: Auction Management
  Scenario: Create and Conduct Auction
    Given I am logged in as a broker
    And there is a catch lot available for auction
    When I create an auction with valid parameters
    And the auction start time arrives
    Then the auction status should be "open"
    And buyers should be able to place bids
    
  Scenario: Bid Validation
    Given an active auction with minimum bid ₱100
    When a buyer places a bid of ₱95
    Then the bid should be rejected
    And an error message should display
    
  Scenario: Winning Bid Determination
    Given an auction with multiple bids
    When the auction end time is reached
    Then the highest valid bid should win
    And the auction status should be "closed"
```

### Financial Calculations
```gherkin
Feature: Settlement Calculations
  Scenario: Commission Calculation
    Given an auction with winning bid of ₱10,000
    When settlement is calculated
    Then commission should be ₱600 (6%)
    And labor fee should be ₱25
    And net to supplier should be ₱9,375
    
  Scenario: Currency Precision
    Given a bid amount of ₱1,234.56
    When stored in the system
    Then it should be stored as 123,456 centavos
    And display formatting should show ₱1,234.56
```

### Data Validation
```gherkin
Feature: Input Validation
  Scenario: Fish Weight Validation
    Given I am creating a catch lot
    When I enter a weight of 0 kg
    Then I should see a validation error
    And the lot should not be saved
    
  Scenario: Email Format Validation
    Given I am registering a new user
    When I enter an invalid email format
    Then I should see an email validation error
    And registration should not proceed
```

### System Reliability
```gherkin
Feature: Health Monitoring
  Scenario: Health Check Endpoint
    When I call GET /api/health
    Then I should receive status 200
    And response should contain { "ok": true }
    And response should include environment info
    
  Scenario: Database Connection Failure
    Given the database is unavailable
    When I try to access the application
    Then I should see a service unavailable message
    And the health check should return error status
```

## Implementation Status

### ✅ Completed Features
- [x] **Currency System**: Philippine Peso with centavos precision
- [x] **Validation**: Zod schemas for all entities
- [x] **Testing**: 54 comprehensive unit tests
- [x] **Authentication**: NextAuth.js integration ready
- [x] **Database**: Prisma ORM with PostgreSQL
- [x] **UI Components**: Tailwind CSS + Radix UI
- [x] **Notifications**: React Hot Toast system
- [x] **Production Deploy**: Docker, PM2, health checks
- [x] **Documentation**: Complete deployment guides
- [x] **Logging & Audit**: Comprehensive request tracking and audit trails
- [x] **Security Monitoring**: Permission denials and login tracking
- [x] **API Middleware**: Request ID generation and correlation

### 🚧 In Progress
- [ ] Real-time bidding (WebSocket implementation)
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] File upload for lot images
- [ ] Advanced reporting dashboard

### 📋 Future Enhancements
- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] Multi-language support (Filipino/English)
- [ ] Advanced analytics
- [ ] API rate limiting
- [ ] Integration with accounting systems

## Logging & Audit System

### Overview
The system includes comprehensive logging and audit capabilities for production monitoring, debugging, and compliance:

- **Request Tracking**: Unique request IDs for correlation across logs and audit records
- **Security Monitoring**: All authorization failures and security events logged
- **Audit Trail**: Permanent database records for all critical business operations
- **Performance Monitoring**: API timing and error rate tracking
- **Production Ready**: Structured logging for container environments

### Audit Event Types
The system tracks these critical events:

#### Business Operations
- `LOT_CREATED`, `LOT_UPDATED`, `LOT_DELETED` - Lot management
- `AUCTION_STARTED`, `AUCTION_CLOSED`, `AUCTION_CANCELLED` - Auction lifecycle
- `BID_PLACED`, `BID_WITHDRAWN` - Bidding activity
- `TRANSACTION_CREATED`, `TRANSACTION_UPDATED` - Financial operations
- `SETTLEMENT_CREATED`, `SETTLEMENT_COMPLETED` - Payment processing

#### Security Events
- `LOGIN_SUCCESS`, `LOGIN_FAILED` - Authentication attempts
- `PERMISSION_DENIED` - Unauthorized access attempts
- `USER_CREATED`, `USER_UPDATED`, `USER_DELETED` - User management

### Implementation Files
- **`src/lib/logger.ts`** - Lightweight request-scoped logging
- **`src/lib/audit-logger.ts`** - Database audit trail system
- **`src/lib/api-middleware.ts`** - Request ID generation and API logging
- **`src/types/audit.ts`** - TypeScript audit event type definitions

### Database Schema Additions
```sql
-- Audit events table
CREATE TABLE audit_events (
    id TEXT PRIMARY KEY,
    event_id TEXT UNIQUE,
    event_type TEXT NOT NULL, -- AuditEventType enum
    resource TEXT NOT NULL,   -- affected table/entity
    resource_id TEXT,         -- specific record ID
    action TEXT NOT NULL,     -- specific operation
    performed_by TEXT,        -- who performed the action
    affected_user_id TEXT,    -- who was affected
    request_id TEXT,          -- correlation with app logs
    ip_address TEXT,          -- source IP
    user_agent TEXT,          -- client info
    old_values JSON,          -- before state
    new_values JSON,          -- after state
    metadata JSON,            -- additional context
    timestamp TIMESTAMP DEFAULT NOW(),
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Add audit fields to key tables
ALTER TABLE suppliers ADD COLUMN created_by TEXT, ADD COLUMN updated_by TEXT;
ALTER TABLE buyers ADD COLUMN created_by TEXT, ADD COLUMN updated_by TEXT;
ALTER TABLE catch_lots ADD COLUMN created_by TEXT, ADD COLUMN updated_by TEXT;
ALTER TABLE auctions ADD COLUMN created_by TEXT, ADD COLUMN updated_by TEXT;
ALTER TABLE transactions ADD COLUMN created_by TEXT, ADD COLUMN updated_by TEXT;
```

### Usage Examples

#### Server Action with Audit
```typescript
export async function startAuction(lotId: string) {
  const requestId = logger.getRequestId()
  
  try {
    logger.serverAction('startAuction', { requestId, metadata: { lotId } })
    
    // ... business logic ...
    
    await auditLogger.logAuctionStarted(result.id, auctionData, {
      performedBy: session.user.id,
      requestId,
    })
    
    return { success: true, data: result }
  } catch (error) {
    logger.error('Auction start failed', { requestId, metadata: { error } })
    throw error
  }
}
```

#### API Route with Logging
```typescript
import { withApiLogging } from '@/lib/api-middleware'

export const GET = withApiLogging(async (req: NextRequest) => {
  // Automatic request ID generation and response timing
  return NextResponse.json({ data: 'example' })
})
```

### Request Correlation Example
```bash
# Application logs
[2025-09-02T10:30:15.123Z] INFO [req-abc123] Server Action: startAuction
[2025-09-02T10:30:15.150Z] INFO [req-abc123] Auction started successfully

# Database audit record
{
  "eventType": "AUCTION_STARTED",
  "requestId": "req-abc123", 
  "performedBy": "user-456",
  "resource": "auction",
  "resourceId": "auction-789"
}
```

## Quality Assurance

### Test Coverage
- **Unit Tests**: 54 tests covering money math, auction logic, validation
- **Integration Tests**: Database operations, API endpoints
- **Type Safety**: 100% TypeScript coverage with strict mode
- **Validation**: Zod schemas for all user inputs

### Performance Benchmarks
- **Page Load**: < 3 seconds (target)
- **API Response**: < 100ms (target)
- **Database Queries**: < 50ms (target)
- **Memory Usage**: < 512MB (target)

### Security Measures
- **Input Sanitization**: All user inputs validated
- **SQL Injection**: Prevented via Prisma ORM
- **XSS Protection**: React built-in + CSP headers
- **Authentication**: Secure session management
- **HTTPS**: SSL/TLS encryption required

## Deployment & Operations

## Deployment & Operations

### Quick Start
```bash
# Install dependencies
pnpm install

# Set up database
npx prisma db push
npx prisma generate

# Start development server
pnpm dev

# Health check
curl http://localhost:3000/api/health
```

### Environment Configuration
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/fish_auction"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Application
NODE_ENV="development"
APP_VERSION="1.0.0"
```

### Environments
- **Development**: `pnpm dev` (hot reload, debug tools)
- **Staging**: Docker compose with test data
- **Production**: PM2 cluster mode, database replication

### Monitoring
- **Health Check**: `/api/health` endpoint with request tracking
- **Application Logs**: Structured logging with request IDs
- **Audit Trail**: Comprehensive database audit records
- **Error Tracking**: Request correlation for debugging
- **Performance**: API timing and error rate monitoring
- **Security Events**: Login attempts and permission denials tracked

### Backup & Recovery
- **Database**: Daily automated backups
- **Application**: Git version control
- **Configuration**: Infrastructure as code
- **Disaster Recovery**: Documented procedures

---

**Approved By**: [Stakeholder Name]  
**Implementation Team**: [Development Team]  
**Go-Live Date**: [Target Date]  

This specification serves as the single source of truth for the Fish Auction System. All changes require version control and stakeholder approval.
