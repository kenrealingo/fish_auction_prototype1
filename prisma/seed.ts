import { PrismaClient, UserRole, AuctionStatus, LotStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Environment-aware seeding configuration
const SEED_CONFIG = {
  // Always create essential admin user
  createAdminUser: true,
  // Only create sample data in development/staging
  createSampleData: process.env.NODE_ENV !== 'production',
  // Create test users only if explicitly enabled
  createTestUsers: process.env.SEED_TEST_USERS === 'true',
  // Clear existing data (DANGEROUS in production)
  clearExistingData: process.env.NODE_ENV !== 'production',
}

console.log('🌱 Starting fish auction database seed...')
console.log('📋 Seed configuration:', SEED_CONFIG)

// Helper function to generate unique numbers
function generateLotNumber(index: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `LOT-${date}-${String(index + 1).padStart(3, '0')}`
}

function generateAuctionNumber(index: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `AUC-${date}-${String(index + 1).padStart(3, '0')}`
}

function generateBidNumber(index: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `BID-${date}-${String(index + 1).padStart(3, '0')}`
}

// Fish types and their typical price ranges (in centavos)
const fishData = [
  { type: 'Tuna', species: 'Thunnus albacares', minPrice: 80000, maxPrice: 150000, grade: 'A' },
  { type: 'Salmon', species: 'Salmo salar', minPrice: 60000, maxPrice: 120000, grade: 'A' },
  { type: 'Mackerel', species: 'Scomber scombrus', minPrice: 30000, maxPrice: 60000, grade: 'B' },
  { type: 'Sardines', species: 'Sardina pilchardus', minPrice: 15000, maxPrice: 35000, grade: 'B' },
  { type: 'Sea Bass', species: 'Dicentrarchus labrax', minPrice: 70000, maxPrice: 130000, grade: 'A' },
]

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

async function clearExistingData() {
  if (!SEED_CONFIG.clearExistingData) {
    console.log('⏭️  Skipping data clearing (production mode)')
    return
  }

  console.log('🗑️  Clearing existing data (development mode)...')
  
  // Clear existing data (in correct order due to foreign keys)
  await prisma.dailyReport.deleteMany()
  await prisma.settlement.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.auction.deleteMany()
  await prisma.catchLot.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.buyer.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')
}

async function createAdminUser() {
  if (!SEED_CONFIG.createAdminUser) {
    console.log('⏭️  Skipping admin user creation')
    return null
  }

  const adminEmail = 'admin@fishauctionhouse.com'
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log('� Admin user already exists:', adminEmail)
    return existingAdmin
  }

  const hashedPassword = await bcrypt.hash('SecureAdmin123!', 10)
  
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'System Administrator',
      password: hashedPassword,
      role: UserRole.BROKER,
      businessName: 'Fish Auction House System',
      phone: '+63-2-8888-0000',
      address: 'Fish Market Administration Office',
      taxId: 'SYS-ADMIN-001',
      bankAccount: 'SYS-BANK-001',
    },
  })

  console.log('✅ Created admin user:', admin.email)
  return admin
}

async function main() {
  try {
    // Step 1: Clear existing data (only in development)
    await clearExistingData()

    // Step 2: Create admin user (production-safe)
    const admin = await createAdminUser()

    // Step 3: Create sample data (only in development/staging)
    if (SEED_CONFIG.createSampleData) {
      await createSampleData()
    } else {
      console.log('⏭️  Skipping sample data creation (production mode)')
    }

    // Step 4: Create test users (only if explicitly enabled)
    if (SEED_CONFIG.createTestUsers) {
      await createTestUsers()
    } else {
      console.log('⏭️  Skipping test user creation')
    }

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

async function createSampleData() {
  console.log('📦 Creating sample data for development...')

  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const broker = await prisma.user.create({
    data: {
      email: 'broker@example.com',
      name: 'Main Broker',
      password: hashedPassword,
      role: UserRole.BROKER,
      businessName: 'Ocean Fish Auction House',
      phone: '+1-555-0100',
      address: '123 Harbor Street, Fish Market District',
      taxId: 'TAX-BROKER-001',
      bankAccount: 'BANK-ACC-BROKER-001',
    },
  })

  console.log('✅ Created broker user:', broker.email)

  // Create 3 suppliers with their users
  const suppliers = []
  const supplierUsers = []
  
  for (let i = 0; i < 3; i++) {
    const supplierUser = await prisma.user.create({
      data: {
        email: `supplier${i + 1}@example.com`,
        name: `Supplier ${i + 1}`,
        password: hashedPassword,
        role: UserRole.SUPPLIER,
        businessName: `Fishing Co. ${i + 1}`,
        phone: `+1-555-02${i + 10}`,
        address: `${100 + i * 10} Pier Street, Harbor District`,
        taxId: `TAX-SUPP-00${i + 1}`,
        bankAccount: `BANK-ACC-SUPP-00${i + 1}`,
      },
    })

    const supplier = await prisma.supplier.create({
      data: {
        userId: supplierUser.id,
        licenseNumber: `FISH-LIC-00${i + 1}`,
        vesselName: `Sea Hunter ${i + 1}`,
        vesselNumber: `VES-00${i + 1}`,
        fishingArea: randomFromArray(['North Atlantic', 'Pacific Coast', 'Gulf Waters', 'Mediterranean']),
      },
    })

    suppliers.push(supplier)
    supplierUsers.push(supplierUser)
  }

  console.log('✅ Created 3 suppliers')

  // Create 4 buyers with their users
  const buyers = []
  const buyerUsers = []
  const buyerTypes = ['RESTAURANT', 'RETAILER', 'WHOLESALER', 'PROCESSOR']

  for (let i = 0; i < 4; i++) {
    const buyerUser = await prisma.user.create({
      data: {
        email: `buyer${i + 1}@example.com`,
        name: `Buyer ${i + 1}`,
        password: hashedPassword,
        role: UserRole.BUYER,
        businessName: `${buyerTypes[i]} Business ${i + 1}`,
        phone: `+1-555-03${i + 10}`,
        address: `${200 + i * 15} Commerce Street, Business District`,
        taxId: `TAX-BUY-00${i + 1}`,
        bankAccount: `BANK-ACC-BUY-00${i + 1}`,
      },
    })

    const buyer = await prisma.buyer.create({
      data: {
        userId: buyerUser.id,
        buyerType: buyerTypes[i],
        creditLimit: randomBetween(500000, 2000000), // 5,000 to 20,000 dollars in centavos
      },
    })

    buyers.push(buyer)
    buyerUsers.push(buyerUser)
  }

  console.log('✅ Created 4 buyers')

  // Create 5 catch lots with auctions
  const lots = []
  const auctions = []

  for (let i = 0; i < 5; i++) {
    const fishInfo = randomFromArray(fishData)
    const weight = parseFloat((Math.random() * 50 + 10).toFixed(2)) // 10-60 kg
    const caughtDate = new Date()
    caughtDate.setDate(caughtDate.getDate() - randomBetween(0, 3)) // Caught 0-3 days ago

    const lot = await prisma.catchLot.create({
      data: {
        lotNumber: generateLotNumber(i),
        supplierId: randomFromArray(suppliers).id,
        fishType: fishInfo.type,
        fishSpecies: fishInfo.species,
        weight: weight,
        grade: fishInfo.grade,
        freshness: randomFromArray(['Fresh', 'Ice Fresh', 'Frozen']),
        origin: randomFromArray(['Atlantic Ocean', 'Pacific Coast', 'Gulf Waters', 'North Sea']),
        status: LotStatus.IN_AUCTION,
        reservePrice: Math.floor(fishInfo.minPrice * weight), // Reserve price per kg * weight
        description: `Premium quality ${fishInfo.type.toLowerCase()}, ${fishInfo.grade} grade`,
        caughtAt: caughtDate,
      },
    })

    // Create auction for this lot
    const startPrice = Math.floor(fishInfo.minPrice * weight * 0.8) // Start 20% below reserve
    const auction = await prisma.auction.create({
      data: {
        auctionNumber: generateAuctionNumber(i),
        lotId: lot.id,
        status: AuctionStatus.ACTIVE,
        startPrice: startPrice,
        currentPrice: startPrice,
        startTime: new Date(Date.now() - randomBetween(0, 3600000)), // Started 0-1 hour ago
        endTime: new Date(Date.now() + randomBetween(1800000, 7200000)), // Ends in 30min-2hours
        duration: 3600, // 1 hour duration
      },
    })

    lots.push(lot)
    auctions.push(auction)
  }

  console.log('✅ Created 5 catch lots with auctions')

  // Create random bids for each auction
  const bids = []
  let bidCounter = 0

  for (const auction of auctions) {
    const numBids = randomBetween(3, 8) // 3-8 bids per auction
    let currentPrice = auction.startPrice
    
    for (let j = 0; j < numBids; j++) {
      // Increase bid by 2-10%
      const increment = Math.floor(currentPrice * (randomBetween(2, 10) / 100))
      currentPrice += increment
      
      const buyer = randomFromArray(buyers)
      const buyerUser = buyerUsers.find(u => u.id === buyer.userId)!

      const bid = await prisma.bid.create({
        data: {
          bidNumber: generateBidNumber(bidCounter++),
          auctionId: auction.id,
          lotId: auction.lotId,
          bidderId: buyer.id,
          buyerUserId: buyerUser.id,
          amount: currentPrice,
          isWinning: j === numBids - 1, // Last bid is winning
          createdAt: new Date(Date.now() - randomBetween(0, 1800000)), // Bids made in last 30 min
        },
      })

      bids.push(bid)

      // Update auction with current highest bid
      if (j === numBids - 1) {
        await prisma.auction.update({
          where: { id: auction.id },
          data: {
            currentPrice: currentPrice,
            winningBidId: bid.id,
          },
        })
      }
    }
  }

  console.log(`✅ Created ${bids.length} bids across all auctions`)

  // Complete some auctions and create transactions
  const completedAuctions = auctions.slice(0, 2) // Complete first 2 auctions

  for (const auction of completedAuctions) {
    await prisma.auction.update({
      where: { id: auction.id },
      data: {
        status: AuctionStatus.COMPLETED,
        endTime: new Date(),
      },
    })

    // Update lot status
    await prisma.catchLot.update({
      where: { id: auction.lotId },
      data: {
        status: LotStatus.SOLD,
      },
    })

    // Create transaction for the winning bid
    const winningBid = await prisma.bid.findUnique({
      where: { id: auction.winningBidId! },
      include: { buyerUser: true, lot: true },
    })

    if (winningBid) {
      const saleAmount = winningBid.amount
      const commission = Math.floor(saleAmount * 0.06) // 6% commission
      const laborFee = 2500 // 2500 centavos labor fee
      const netAmount = saleAmount - commission - laborFee

      // Transaction for the sale (buyer pays)
      await prisma.transaction.create({
        data: {
          transactionNumber: `TXN-SALE-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          lotId: winningBid.lotId,
          bidId: winningBid.id,
          userId: winningBid.buyerUserId,
          type: 'SALE',
          amount: -saleAmount, // Negative for buyer (payment)
          saleAmount: saleAmount,
          commission: commission,
          laborFee: laborFee,
          netAmount: -saleAmount,
          description: `Purchase of ${winningBid.lot.fishType} lot ${winningBid.lot.lotNumber}`,
        },
      })

      // Transaction for supplier (receives payment minus fees)
      const supplierLot = await prisma.catchLot.findUnique({
        where: { id: winningBid.lotId },
        include: { supplier: { include: { user: true } } },
      })

      if (supplierLot) {
        await prisma.transaction.create({
          data: {
            transactionNumber: `TXN-PAYMENT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            lotId: winningBid.lotId,
            bidId: winningBid.id,
            userId: supplierLot.supplier.userId,
            type: 'SALE',
            amount: netAmount, // Positive for supplier (income)
            saleAmount: saleAmount,
            commission: commission,
            laborFee: laborFee,
            netAmount: netAmount,
            description: `Sale of ${supplierLot.fishType} lot ${supplierLot.lotNumber}`,
          },
        })
      }

      // Commission transaction for broker
      await prisma.transaction.create({
        data: {
          transactionNumber: `TXN-COMM-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          lotId: winningBid.lotId,
          bidId: winningBid.id,
          userId: broker.id,
          type: 'COMMISSION',
          amount: commission + laborFee, // Positive for broker (income)
          saleAmount: saleAmount,
          commission: commission,
          laborFee: laborFee,
          netAmount: commission + laborFee,
          description: `Commission and labor fee for lot ${winningBid.lot.lotNumber}`,
        },
      })
    }
  }

  console.log('✅ Created transactions for completed auctions')

  // Create daily report
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalAuctions = auctions.length
  const totalLots = lots.length
  const totalBids = bids.length
  const completedSales = completedAuctions.length
  
  // Calculate totals from completed transactions
  const saleTransactions = await prisma.transaction.findMany({
    where: {
      type: 'SALE',
      createdAt: {
        gte: today,
      },
    },
  })

  const totalRevenue = saleTransactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  const totalCommission = saleTransactions
    .reduce((sum, t) => sum + (t.commission || 0), 0)

  const totalLaborFees = saleTransactions
    .reduce((sum, t) => sum + (t.laborFee || 0), 0)

  const totalWeight = lots
    .slice(0, completedSales)
    .reduce((sum, lot) => sum + lot.weight, 0)

  const averagePrice = totalWeight > 0 ? Math.floor(totalRevenue / totalWeight) : 0

  await prisma.dailyReport.create({
    data: {
      reportDate: today,
      generatedBy: broker.id,
      totalAuctions: totalAuctions,
      totalLots: totalLots,
      totalBids: totalBids,
      totalRevenue: totalRevenue,
      totalCommission: totalCommission,
      totalLaborFees: totalLaborFees,
      totalWeight: totalWeight,
      averagePrice: averagePrice,
      topFishType: 'Tuna', // Most common in our seed data
      activeSuppliers: suppliers.length,
      activeBuyers: buyers.length,
    },
  })

  console.log('✅ Created daily report')

  // Summary
  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`  👤 Users: 1 broker + 3 suppliers + 4 buyers = 8 total`)
  console.log(`  🐟 Catch lots: ${lots.length}`)
  console.log(`  🔨 Auctions: ${auctions.length} (${completedAuctions.length} completed)`)
  console.log(`  💰 Bids: ${bids.length}`)
  console.log(`  📋 Transactions: Created for ${completedAuctions.length} completed sales`)
  console.log(`  📈 Daily report: Generated for today`)
  
  console.log('\n🔐 Login credentials:')
  console.log('  Broker: broker@example.com / password123')
  console.log('  Suppliers: supplier1@example.com / password123 (also supplier2, supplier3)')
  console.log('  Buyers: buyer1@example.com / password123 (also buyer2, buyer3, buyer4)')
}

async function createTestUsers() {
  console.log('👥 Creating additional test users...')
  
  const hashedPassword = await bcrypt.hash('test123', 10)
  
  // Create additional test broker
  const testBroker = await prisma.user.create({
    data: {
      email: 'testbroker@example.com',
      name: 'Test Broker',
      password: hashedPassword,
      role: UserRole.BROKER,
      businessName: 'Test Auction House',
      phone: '+63-2-TEST-001',
      address: 'Test Address',
      taxId: 'TEST-BROKER-001',
      bankAccount: 'TEST-BANK-001',
    },
  })

  console.log('✅ Created test broker user:', testBroker.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during database seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
