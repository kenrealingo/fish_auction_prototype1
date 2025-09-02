import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft,
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  Trophy,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Building,
  Activity,
  FileText,
  User
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

// Mock data for individual buyer
const mockBuyerDetails = {
  buyer1: {
    id: "buyer1",
    name: "Ocean Fresh Restaurants",
    email: "buyer1@example.com",
    businessType: "RESTAURANT",
    phone: "+1-555-0310",
    address: "200 Commerce Street, Business District",
    taxId: "TAX-BUY-001",
    bankAccount: "BANK-ACC-BUY-001",
    creditLimit: 500000,
    totalBids: 45,
    wins: 18,
    totalSpendCents: 320000,
    winRate: 40,
    avgBidAmount: 7111,
    lastPurchase: "2025-08-30",
    status: "ACTIVE",
    joinedDate: "2024-01-15",
    preferredFishTypes: ["Atlantic Salmon", "Red Snapper", "Halibut"],
    purchaseHistory: [
      {
        id: "p1",
        date: "2025-08-31",
        fishType: "Atlantic Salmon",
        weight: 25.5,
        pricePerKg: 1250,
        totalAmount: 31875,
        auctionId: "auction1",
        status: "COMPLETED"
      },
      {
        id: "p2", 
        date: "2025-08-29",
        fishType: "Halibut",
        weight: 22.3,
        pricePerKg: 1650,
        totalAmount: 36795,
        auctionId: "auction5",
        status: "COMPLETED"
      },
      {
        id: "p3",
        date: "2025-08-27",
        fishType: "Red Snapper", 
        weight: 15.8,
        pricePerKg: 1800,
        totalAmount: 28440,
        auctionId: "auction8",
        status: "COMPLETED"
      }
    ],
    biddingActivity: [
      { month: "Jan 2025", bids: 8, wins: 3, spend: 45000 },
      { month: "Feb 2025", bids: 6, wins: 2, spend: 32000 },
      { month: "Mar 2025", bids: 9, wins: 4, spend: 58000 },
      { month: "Apr 2025", bids: 7, wins: 3, spend: 41000 },
      { month: "May 2025", bids: 5, wins: 2, spend: 28000 },
      { month: "Jun 2025", bids: 10, wins: 4, spend: 67000 }
    ]
  },
  buyer2: {
    id: "buyer2",
    name: "Harbor Market Chain", 
    email: "buyer2@example.com",
    businessType: "RETAILER",
    phone: "+1-555-0325",
    address: "215 Commerce Street, Business District",
    taxId: "TAX-BUY-002",
    bankAccount: "BANK-ACC-BUY-002",
    creditLimit: 750000,
    totalBids: 32,
    wins: 15,
    totalSpendCents: 285000,
    winRate: 47,
    avgBidAmount: 8906,
    lastPurchase: "2025-08-31",
    status: "ACTIVE",
    joinedDate: "2024-03-20",
    preferredFishTypes: ["Red Snapper", "Sea Bass", "Cod"],
    purchaseHistory: [
      {
        id: "p1",
        date: "2025-08-30",
        fishType: "Red Snapper",
        weight: 18.0,
        pricePerKg: 1800,
        totalAmount: 32400,
        auctionId: "auction3",
        status: "PENDING"
      }
    ],
    biddingActivity: [
      { month: "Jan 2025", bids: 4, wins: 2, spend: 38000 },
      { month: "Feb 2025", bids: 5, wins: 3, spend: 47000 },
      { month: "Mar 2025", bids: 6, wins: 2, spend: 35000 },
      { month: "Apr 2025", bids: 7, wins: 3, spend: 52000 },
      { month: "May 2025", bids: 5, wins: 2, spend: 41000 },
      { month: "Jun 2025", bids: 5, wins: 3, spend: 42000 }
    ]
  }
}

interface BuyerDetailPageProps {
  params: {
    id: string
  }
}

export default async function BuyerDetailPage({ params }: BuyerDetailPageProps) {
  const session = await getServerSession(authOptions)
  
  // Only brokers can access this page
  if (session?.user.role !== 'BROKER') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only brokers can view buyer details.</p>
        </div>
      </div>
    )
  }

  const buyer = mockBuyerDetails[params.id as keyof typeof mockBuyerDetails]
  
  if (!buyer) {
    notFound()
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/buyers">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Buyers
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-gray-900">{buyer.name}</h1>
              <Badge variant="outline" className={getBusinessTypeColor(buyer.businessType)}>
                {buyer.businessType}
              </Badge>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                {buyer.status}
              </Badge>
            </div>
            <p className="text-gray-600">
              Detailed buyer information and purchase history
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <User className="h-4 w-4 mr-2" />
            Edit Buyer
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyer.totalBids}</div>
            <p className="text-xs text-muted-foreground">All time bids placed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wins</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyer.wins}</div>
            <p className="text-xs text-muted-foreground">{buyer.winRate}% win rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(buyer.totalSpendCents)}</div>
            <p className="text-xs text-muted-foreground">Total purchase amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bid</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(buyer.avgBidAmount)}</div>
            <p className="text-xs text-muted-foreground">Per bid average</p>
          </CardContent>
        </Card>
      </div>

      {/* Buyer Information and Activity */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Buyer Details */}
        <Card>
          <CardHeader>
            <CardTitle>Buyer Information</CardTitle>
            <CardDescription>
              Contact and business details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{buyer.email}</div>
                <div className="text-sm text-gray-600">Email Address</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{buyer.phone}</div>
                <div className="text-sm text-gray-600">Phone Number</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{buyer.address}</div>
                <div className="text-sm text-gray-600">Business Address</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{buyer.taxId}</div>
                <div className="text-sm text-gray-600">Tax ID</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{formatCurrency(buyer.creditLimit)}</div>
                <div className="text-sm text-gray-600">Credit Limit</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="font-medium">{new Date(buyer.joinedDate).toLocaleDateString()}</div>
                <div className="text-sm text-gray-600">Joined Date</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bidding Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>
              Recent bidding performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {buyer.biddingActivity.slice(-6).map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{activity.month}</div>
                    <div className="text-sm text-gray-600">
                      {activity.bids} bids, {activity.wins} wins
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatCurrency(activity.spend)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Math.round((activity.wins / activity.bids) * 100)}% win rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preferred Fish Types */}
        <Card>
          <CardHeader>
            <CardTitle>Preferred Fish Types</CardTitle>
            <CardDescription>
              Most frequently purchased species
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buyer.preferredFishTypes.map((fishType, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium">{fishType}</div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Preferred
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <Activity className="h-4 w-4 inline mr-1" />
                Last purchase: {new Date(buyer.lastPurchase).toLocaleDateString()}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase History */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>
            Complete record of successful purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Fish Type</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Weight</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Price/kg</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Auction</th>
                </tr>
              </thead>
              <tbody>
                {buyer.purchaseHistory.map((purchase) => (
                  <tr key={purchase.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(purchase.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium">{purchase.fishType}</td>
                    <td className="py-3 px-4 text-right">{purchase.weight} kg</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(purchase.pricePerKg)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      {formatCurrency(purchase.totalAmount)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className={getStatusColor(purchase.status)}>
                        {purchase.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Link 
                        href={`/auctions/${purchase.auctionId}`}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {purchase.auctionId}
                      </Link>
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
