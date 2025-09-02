# Fish Auction System

A comprehensive fish auction platform built for the Philippine market.

## � Complete Documentation

**All project documentation is consolidated in a single file:**

👉 **[spec.md](./spec.md)** - Complete project specification

This file contains:
- Project overview and business rules
- Complete database schema
- API specifications
- TypeScript models
- Acceptance tests
- Implementation status
- Logging & audit system
- Deployment instructions
- Quality assurance guidelines

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up database
npx prisma db push
npx prisma generate

# Start development server
pnpm dev
```

## 🏥 Health Check

```bash
curl http://localhost:3000/api/health
```

---

**📋 For complete documentation, see [spec.md](./spec.md)**
- **Comprehensive Testing** - 54 tests covering all business logic
- **Production Ready** - Docker, PM2, health checks
- **Multi-Role System** - Suppliers, Buyers, Brokers
- **Real-time Auctions** - Time-bound bidding with validation
- **Financial Settlements** - Commission and fee calculations

## 📊 System Status

- **Health Check**: `GET /api/health`
- **Tests**: 54/54 passing ✅
- **Type Safety**: 100% TypeScript coverage
- **Currency**: Philippine Peso (₱) with centavos
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Production ready

## 📖 Documentation

- **[`spec.md`](./spec.md)** - Complete project specification (READ THIS FIRST)
- **[`.env.example`](./.env.example)** - Environment configuration template  
- **[`deploy.sh`](./deploy.sh)** - Production deployment script

---

**For complete project details, requirements, and specifications: [`spec.md`](./spec.md)**
