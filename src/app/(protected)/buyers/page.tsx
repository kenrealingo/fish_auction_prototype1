import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  DollarSign, 
  ShoppingCart,
  Package,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Trophy,
  Eye
} from "lucide-react"
import Link from "next/link"

// Mock data - in real app, fetch from database
const mockBuyers = [
  {
    id: "buyer1",
    name: "Ocean Fresh Restaurants",
    email: "buyer1@example.com",
    businessType: "RESTAURANT",
    phone: "+1-555-0310",
    address: "200 Commerce Street, Business District",
    creditLimit: 500000, // in centavos
    totalBids: 45,
    wins: 18,
    totalSpendCents: 320000, // in centavos
    winRate: 40,
    avgBidAmount: 7111, // in centavos
    lastPurchase: "2025-08-30",
    status: "ACTIVE",
    joinedDate: "2024-01-15"
  },
  {
    id: "buyer2", 
    name: "Harbor Market Chain",
    email: "buyer2@example.com",
    businessType: "RETAILER",
    phone: "+1-555-0325",
    address: "215 Commerce Street, Business District", 
    creditLimit: 750000,
    totalBids: 32,
    wins: 15,
    totalSpendCents: 285000,
    winRate: 47,
    avgBidAmount: 8906,
    lastPurchase: "2025-08-31",
    status: "ACTIVE",
    joinedDate: "2024-03-20"
  },
  {
    id: "buyer3",
    name: "Wholesale Fish Co.",
    email: "buyer3@example.com", 
    businessType: "WHOLESALER",
    phone: "+1-555-0340",
    address: "230 Commerce Street, Business District",
    creditLimit: 1000000,
    totalBids: 68,
    wins: 22,
    totalSpendCents: 450000,
    winRate: 32,
    avgBidAmount: 6618,
    lastPurchase: "2025-09-01",
    status: "ACTIVE",
    joinedDate: "2023-11-10"
  },
  {
    id: "buyer4",
    name: "Premium Fish Processing",
    email: "buyer4@example.com",
    businessType: "PROCESSOR", 
    phone: "+1-555-0355",
    address: "245 Commerce Street, Business District",
    creditLimit: 1200000,
    totalBids: 28,
    wins: 12,
    totalSpendCents: 380000,
    winRate: 43,
    avgBidAmount: 13571,
    lastPurchase: "2025-08-29",
    status: "ACTIVE",
    joinedDate: "2024-06-01"
  }
]

// Recent purchases data
const mockPurchases = [
  {
    id: "purchase1",
    buyerId: "buyer1",
    buyerName: "Ocean Fresh Restaurants",
    lotId: "lot001",
    fishType: "Atlantic Salmon",
    weight: 25.5,
    pricePerKg: 1250, // in centavos
    totalAmount: 31875,
    purchaseDate: "2025-08-31",
    auctionId: "auction1",
    status: "COMPLETED"
  },
  {
    id: "purchase2", 
    buyerId: "buyer3",
    buyerName: "Wholesale Fish Co.",
    lotId: "lot003",
    fishType: "Fresh Tuna",
    weight: 45.2,
    pricePerKg: 2000,
    totalAmount: 90400,
    purchaseDate: "2025-08-31",
    auctionId: "auction2", 
    status: "COMPLETED"
  },
  {
    id: "purchase3",
    buyerId: "buyer2",
    buyerName: "Harbor Market Chain", 
    lotId: "lot005",
    fishType: "Red Snapper",
    weight: 18.0,
    pricePerKg: 1800,
    totalAmount: 32400,
    purchaseDate: "2025-08-30",
    auctionId: "auction3",
    status: "PENDING"
  },
  {
    id: "purchase4",
    buyerId: "buyer4", 
    buyerName: "Premium Fish Processing",
    lotId: "lot007",
    fishType: "Sea Bass",
    weight: 35.8,
    pricePerKg: 2200,
    totalAmount: 78760,
    purchaseDate: "2025-08-30",
    auctionId: "auction4",
    status: "COMPLETED"
  },
  {
    id: "purchase5",
    buyerId: "buyer1",
    buyerName: "Ocean Fresh Restaurants",
    lotId: "lot009", 
    fishType: "Halibut",
    weight: 22.3,
    pricePerKg: 1650,
    totalAmount: 36795,
    purchaseDate: "2025-08-29",
    auctionId: "auction5",
    status: "COMPLETED"
  }
]

export default async function BuyersPage() {
  const session = await getServerSession(authOptions)
  
  // Only brokers can access this page
  if (session?.user.role !== 'BROKER') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only brokers can view buyer management.</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getBusinessTypeColor = (type: string) => {
    switch (type) {
      case 'RESTAURANT':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'RETAILER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'WHOLESALER':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PROCESSOR':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Calculate aggregate stats
  const totalBuyers = mockBuyers.length
  const totalBids = mockBuyers.reduce((sum, buyer) => sum + buyer.totalBids, 0)
  const totalWins = mockBuyers.reduce((sum, buyer) => sum + buyer.wins, 0)
  const totalSpend = mockBuyers.reduce((sum, buyer) => sum + buyer.totalSpendCents, 0)
  const averageWinRate = totalBuyers > 0 ? Math.round((totalWins / totalBids) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyers Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor all registered buyers in the fish auction platform
          </p>
        </div>
        <Button asChild>
          <Link href="/buyers/new">
            <Users className="mr-2 h-4 w-4" />
            Add New Buyer
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBuyers}</div>
            <p className="text-xs text-muted-foreground">Active registered buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBids}</div>
            <p className="text-xs text-muted-foreground">All bids placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wins</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWins}</div>
            <p className="text-xs text-muted-foreground">{averageWinRate}% win rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSpend)}</div>
            <p className="text-xs text-muted-foreground">Total buyer spending</p>
          </CardContent>
        </Card>
      </div>

      {/* Buyers List */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Buyers</CardTitle>
          <CardDescription>
            Complete list of buyers with their performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockBuyers.map((buyer) => (
              <div key={buyer.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{buyer.name}</h3>
                      <Badge variant="outline" className={getBusinessTypeColor(buyer.businessType)}>
                        {buyer.businessType}
                      </Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        {buyer.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {buyer.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {buyer.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {buyer.address.split(',')[0]}
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit: {formatCurrency(buyer.creditLimit)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Joined: {new Date(buyer.joinedDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Last Purchase: {new Date(buyer.lastPurchase).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/buyers/${buyer.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                  </Button>
                </div>

                {/* Buyer Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{buyer.totalBids}</div>
                    <div className="text-xs text-gray-600">Total Bids</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{buyer.wins}</div>
                    <div className="text-xs text-gray-600">Wins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{buyer.winRate}%</div>
                    <div className="text-xs text-gray-600">Win Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-orange-600">{formatCurrency(buyer.totalSpendCents)}</div>
                    <div className="text-xs text-gray-600">Total Spend</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
          <CardDescription>
            Latest fish lot purchases by all buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Buyer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Fish Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Weight</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Price/kg</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockPurchases.map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{purchase.buyerName}</div>
                        <div className="text-sm text-gray-600">ID: {purchase.buyerId}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{purchase.fishType}</div>
                      <div className="text-sm text-gray-600">Lot: {purchase.lotId}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{purchase.weight} kg</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(purchase.pricePerKg)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(purchase.purchaseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getStatusColor(purchase.status)}>
                        {purchase.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/auctions/${purchase.auctionId}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
