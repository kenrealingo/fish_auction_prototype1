"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { 
  Fish,
  DollarSign,
  Target,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Gavel,
  Timer
} from "lucide-react"
import { placeBid } from "@/lib/auction-actions"

interface BiddingDashboardProps {
  userRole: string
  userEmail: string
}

interface AuctionData {
  id: string
  auctionNumber: string
  status: string
  startPrice: number
  currentPrice: number
  startTime: string
  endTime: string
  lot: {
    id: string
    lotNumber: string
    fishType: string
    weight: number
    grade: string
    freshness: string
    supplier: {
      user: { name: string }
    }
  }
  bids: BidData[]
}

interface BidData {
  id: string
  bidNumber: string
  amount: number
  buyerUser: {
    id: string
    name: string
    email: string
  }
  isWinning: boolean
  createdAt: string
}

// Mock data for buyers - in real app, fetch from API
const mockBuyers = [
  { id: "buyer1", name: "Ocean Fresh Markets", email: "ocean@markets.com" },
  { id: "buyer2", name: "Coastal Seafood Co.", email: "coastal@seafood.com" },
  { id: "buyer3", name: "Premium Fish Imports", email: "premium@fish.com" },
  { id: "buyer4", name: "Harbor Bay Distributors", email: "harbor@bay.com" }
]

// Mock auction data - in real app, fetch from API
const mockOpenAuctions: AuctionData[] = [
  {
    id: "auction1",
    auctionNumber: "AUC-20250902-001",
    status: "ACTIVE",
    startPrice: 140000, // $1400.00 in centavos
    currentPrice: 165000, // $1650.00
    startTime: "2025-09-02T10:00:00",
    endTime: "2025-09-02T16:00:00",
    lot: {
      id: "lot1",
      lotNumber: "LOT-20250902-001",
      fishType: "Atlantic Salmon",
      weight: 28.5,
      grade: "A+",
      freshness: "Fresh",
      supplier: {
        user: { name: "Atlantic Fisheries" }
      }
    },
    bids: [
      {
        id: "bid1",
        bidNumber: "BID-001",
        amount: 150000,
        buyerUser: {
          id: "buyer1",
          name: "Ocean Fresh Markets",
          email: "ocean@markets.com"
        },
        isWinning: false,
        createdAt: "2025-09-02T11:30:00"
      },
      {
        id: "bid2",
        bidNumber: "BID-002",
        amount: 165000,
        buyerUser: {
          id: "buyer2",
          name: "Coastal Seafood Co.",
          email: "coastal@seafood.com"
        },
        isWinning: true,
        createdAt: "2025-09-02T12:15:00"
      }
    ]
  },
  {
    id: "auction2",
    auctionNumber: "AUC-20250902-002",
    status: "ACTIVE",
    startPrice: 89000, // $890.00
    currentPrice: 95500, // $955.00
    startTime: "2025-09-02T11:00:00",
    endTime: "2025-09-02T17:00:00",
    lot: {
      id: "lot2",
      lotNumber: "LOT-20250902-002",
      fishType: "Red Snapper",
      weight: 15.2,
      grade: "A",
      freshness: "Ice Fresh",
      supplier: {
        user: { name: "Gulf Coast Fishing" }
      }
    },
    bids: [
      {
        id: "bid3",
        bidNumber: "BID-003",
        amount: 95500,
        buyerUser: {
          id: "buyer3",
          name: "Premium Fish Imports",
          email: "premium@fish.com"
        },
        isWinning: true,
        createdAt: "2025-09-02T11:45:00"
      }
    ]
  }
]

const formatCurrency = (centavos: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

const formatTimeRemaining = (endTime: string) => {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const remaining = end - now

  if (remaining <= 0) return "Auction ended"

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else {
    return `${minutes}m remaining`
  }
}

function BidForm({ auction, onBidPlaced }: { auction: AuctionData, onBidPlaced: () => void }) {
  const [selectedBuyer, setSelectedBuyer] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const minBid = auction.currentPrice + 500 // Minimum increment $5.00

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBuyer) {
      setError("Please select a buyer")
      return
    }

    if (!bidAmount) {
      setError("Please enter a bid amount")
      return
    }

    const amount = parseFloat(bidAmount) * 100 // Convert to centavos

    if (amount < minBid) {
      setError(`Minimum bid is ${formatCurrency(minBid)}`)
      return
    }

    setIsLoading(true)
    setError("")
    
    try {
      const result = await placeBid(auction.id, amount)
      
      if (result.success) {
        setSuccess("Bid placed successfully!")
        setBidAmount("")
        setSelectedBuyer("")
        onBidPlaced()
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000)
      } else {
        setError(result.error || "Failed to place bid")
      }
    } catch (err) {
      console.error('Bid placement error:', err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedBuyerName = mockBuyers.find(b => b.id === selectedBuyer)?.name || ""

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5" />
          Place Bid
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyer">Select Buyer</Label>
            <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose buyer..." />
              </SelectTrigger>
              <SelectContent>
                {mockBuyers.map((buyer) => (
                  <SelectItem key={buyer.id} value={buyer.id}>
                    {buyer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Bid Amount (min: {formatCurrency(minBid)})
            </Label>
            <Input
              id="amount"
              type="number"
              step="5"
              min={minBid / 100}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={(minBid / 100).toString()}
            />
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !selectedBuyer || !bidAmount}
            className="w-full"
          >
            <Target className="h-4 w-4 mr-2" />
            {isLoading ? "Placing Bid..." : `Place Bid${selectedBuyerName ? ` for ${selectedBuyerName}` : ""}`}
          </Button>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function BidHistory({ bids }: { bids: BidData[] }) {
  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" />
            Bid History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">No bids placed yet</p>
        </CardContent>
      </Card>
    )
  }

  // Sort bids by amount descending (highest first)
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Bid History ({bids.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedBids.map((bid, index) => (
          <div 
            key={bid.id}
            className={`flex justify-between items-center p-3 rounded-lg border ${
              bid.isWinning 
                ? 'bg-green-50 border-green-200 ring-1 ring-green-300' 
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div>
              <p className="font-medium flex items-center gap-2">
                {bid.buyerUser.name}
                {index === 0 && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    Highest
                  </Badge>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(bid.createdAt).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg ${bid.isWinning ? 'text-green-600' : ''}`}>
                {formatCurrency(bid.amount)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function BiddingDashboard({ userRole, userEmail }: BiddingDashboardProps) {
  const [auctions, setAuctions] = useState<AuctionData[]>(mockOpenAuctions)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Suppress unused variable warning for now
  console.log('User role:', userRole, 'Email:', userEmail)

  const refreshData = async () => {
    setIsRefreshing(true)
    
    // Simulate API call - in real app, fetch fresh data
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // In real app: const freshData = await fetchOpenAuctions()
    setAuctions(mockOpenAuctions)
    setLastUpdated(new Date())
    setIsRefreshing(false)
  }

  const handleBidPlaced = () => {
    // Refresh data when a bid is placed
    refreshData()
  }

  // Auto-refresh every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  if (auctions.length === 0) {
    return (
      <div className="text-center py-12">
        <Gavel className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-600 mb-2">No Active Auctions</h2>
        <p className="text-gray-500">There are currently no open auctions available for bidding.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh info */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">
            Active Auctions ({auctions.length})
          </h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Auto-refresh: 3s
          </Badge>
        </div>
        
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Auction cards */}
      <div className="space-y-8">
        {auctions.map((auction) => (
          <Card key={auction.id} className="border-2">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Fish className="h-5 w-5" />
                    {auction.lot.fishType} - {auction.lot.lotNumber}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-2">
                    <span>{auction.lot.weight}kg • Grade {auction.lot.grade}</span>
                    <span>•</span>
                    <span>{auction.lot.supplier.user.name}</span>
                  </CardDescription>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800 mb-2">
                    Live Auction
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Timer className="h-4 w-4" />
                    {formatTimeRemaining(auction.endTime)}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Auction stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Starting Price</p>
                  <p className="text-lg font-bold flex items-center justify-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(auction.startPrice)}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Current Price</p>
                  <p className="text-xl font-bold text-green-600 flex items-center justify-center gap-1">
                    <TrendingUp className="h-5 w-5" />
                    {formatCurrency(auction.currentPrice)}
                  </p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Per kg</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(Math.round(auction.currentPrice / auction.lot.weight))}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Bidding section */}
              <div className="grid md:grid-cols-2 gap-6">
                <BidForm auction={auction} onBidPlaced={handleBidPlaced} />
                <BidHistory bids={auction.bids} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
