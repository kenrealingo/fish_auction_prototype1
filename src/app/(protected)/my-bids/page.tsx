import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  ShoppingCart, 
  TrendingUp, 
  Trophy,
  DollarSign,
  Fish,
  Clock,
  Eye,
  Gavel,
  Target,
  Activity
} from "lucide-react"
import Link from "next/link"

// Mock data for buyer's bids - in real app, fetch from database based on session user
const mockBidData = {
  stats: {
    totalBids: 18,
    activeBids: 4,
    wonBids: 7,
    totalSpent: 285000, // in centavos
    winRate: 39,
    avgBidAmount: 8906
  },
  activeBids: [
    {
      id: "bid001",
      auctionId: "auction101",
      lotId: "lot201",
      fishType: "Atlantic Salmon",
      weight: 28.5,
      startingPrice: 1200, // in centavos
      currentHighBid: 1350,
      myBidAmount: 1350,
      isWinning: true,
      bidTime: "2025-09-01T10:30:00",
      auctionEndTime: "2025-09-01T16:00:00",
      status: "ACTIVE"
    },
    {
      id: "bid002",
      auctionId: "auction102", 
      lotId: "lot202",
      fishType: "Red Snapper",
      weight: 22.0,
      startingPrice: 1500,
      currentHighBid: 1680,
      myBidAmount: 1620,
      isWinning: false,
      bidTime: "2025-09-01T11:15:00",
      auctionEndTime: "2025-09-01T17:30:00",
      status: "ACTIVE"
    },
    {
      id: "bid003",
      auctionId: "auction103",
      lotId: "lot203", 
      fishType: "Sea Bass",
      weight: 35.2,
      startingPrice: 1800,
      currentHighBid: 1950,
      myBidAmount: 1950,
      isWinning: true,
      bidTime: "2025-09-01T09:45:00",
      auctionEndTime: "2025-09-01T15:00:00",
      status: "ACTIVE"
    },
    {
      id: "bid004",
      auctionId: "auction104",
      lotId: "lot204",
      fishType: "Halibut", 
      weight: 18.7,
      startingPrice: 1600,
      currentHighBid: 1750,
      myBidAmount: 1700,
      isWinning: false,
      bidTime: "2025-09-01T12:00:00",
      auctionEndTime: "2025-09-01T18:00:00",
      status: "ACTIVE"
    }
  ],
  recentBids: [
    {
      id: "bid005",
      auctionId: "auction201",
      lotId: "lot301",
      fishType: "Tuna",
      weight: 45.0,
      finalPrice: 2200,
      myBidAmount: 2200,
      won: true,
      totalAmount: 99000,
      bidTime: "2025-08-31T14:30:00",
      auctionEndTime: "2025-08-31T16:00:00",
      status: "WON"
    },
    {
      id: "bid006", 
      auctionId: "auction202",
      lotId: "lot302",
      fishType: "Cod",
      weight: 32.5,
      finalPrice: 1400,
      myBidAmount: 1350,
      won: false,
      totalAmount: 0,
      bidTime: "2025-08-30T11:20:00",
      auctionEndTime: "2025-08-30T15:30:00",
      status: "LOST"
    },
    {
      id: "bid007",
      auctionId: "auction203", 
      lotId: "lot303",
      fishType: "Mackerel",
      weight: 15.8,
      finalPrice: 950,
      myBidAmount: 950,
      won: true,
      totalAmount: 15010,
      bidTime: "2025-08-29T13:45:00",
      auctionEndTime: "2025-08-29T17:00:00",
      status: "WON"
    },
    {
      id: "bid008",
      auctionId: "auction204",
      lotId: "lot304",
      fishType: "Sole",
      weight: 21.2,
      finalPrice: 1800,
      myBidAmount: 1750,
      won: false,
      totalAmount: 0,
      bidTime: "2025-08-28T10:15:00",
      auctionEndTime: "2025-08-28T14:30:00",
      status: "LOST"
    }
  ]
}

export default async function MyBidsPage() {
  const session = await getServerSession(authOptions)
  
  // Only buyers can access this page
  if (session?.user.role !== 'BUYER') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only buyers can view their bidding activity.</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(cents / 100)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'WON':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'LOST':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getBidStatusIcon = (status: string, isWinning?: boolean) => {
    if (status === 'ACTIVE') {
      return isWinning ? <Trophy className="h-4 w-4 text-yellow-600" /> : <Target className="h-4 w-4 text-blue-600" />
    }
    if (status === 'WON') return <Trophy className="h-4 w-4 text-green-600" />
    if (status === 'LOST') return <Target className="h-4 w-4 text-red-600" />
    return <Clock className="h-4 w-4 text-gray-600" />
  }

  const timeUntilEnd = (endTime: string) => {
    const end = new Date(endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`
    } else {
      return `${minutes}m left`
    }
  }

  const { stats, activeBids, recentBids } = mockBidData

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Bids</h1>
          <p className="text-gray-600 mt-1">
            Track your bidding activity and manage active bids
          </p>
        </div>
        <Button asChild>
          <Link href="/auctions">
            <Gavel className="mr-2 h-4 w-4" />
            Browse Auctions
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBids}</div>
            <p className="text-xs text-muted-foreground">{stats.activeBids} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wins</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wonBids}</div>
            <p className="text-xs text-muted-foreground">{stats.winRate}% win rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpent)}</div>
            <p className="text-xs text-muted-foreground">Successful purchases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Bid</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgBidAmount)}</div>
            <p className="text-xs text-muted-foreground">Per bid amount</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Bids */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Active Bids
          </CardTitle>
          <CardDescription>
            Your current bids in ongoing auctions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeBids.map((bid) => (
              <div key={bid.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getBidStatusIcon(bid.status, bid.isWinning)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{bid.fishType}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Fish className="h-4 w-4" />
                        {bid.weight} kg
                        <span className="mx-2">•</span>
                        Lot: {bid.lotId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(bid.status)}>
                      {bid.isWinning ? 'WINNING' : 'OUTBID'}
                    </Badge>
                    <div className="text-sm text-gray-600 mt-1">
                      {timeUntilEnd(bid.auctionEndTime)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-4 bg-gray-50 rounded-lg p-3">
                  <div>
                    <div className="text-xs text-gray-600">Starting Price</div>
                    <div className="font-medium">{formatCurrency(bid.startingPrice)}/kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Current High</div>
                    <div className="font-medium text-blue-600">{formatCurrency(bid.currentHighBid)}/kg</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">My Bid</div>
                    <div className={`font-semibold ${bid.isWinning ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatCurrency(bid.myBidAmount)}/kg
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600">Potential Total</div>
                    <div className="font-medium">{formatCurrency(bid.myBidAmount * bid.weight)}</div>
                  </div>
                  <div className="flex items-end justify-end">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/auctions/${bid.auctionId}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Bid History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Bid History</CardTitle>
          <CardDescription>
            Your completed and unsuccessful bids
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
                  <th className="text-right py-3 px-4 font-medium text-gray-900">My Bid</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Final Price</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Result</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentBids.map((bid) => (
                  <tr key={bid.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {new Date(bid.auctionEndTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{bid.fishType}</div>
                      <div className="text-sm text-gray-600">Lot: {bid.lotId}</div>
                    </td>
                    <td className="py-3 px-4 text-right">{bid.weight} kg</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(bid.myBidAmount)}/kg</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(bid.finalPrice)}/kg
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getBidStatusIcon(bid.status)}
                        <Badge variant="outline" className={getStatusColor(bid.status)}>
                          {bid.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {bid.won ? (
                        <span className="font-semibold text-green-600">
                          {formatCurrency(bid.totalAmount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/auctions/${bid.auctionId}`}>
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
