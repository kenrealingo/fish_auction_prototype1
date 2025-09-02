"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Clock,
  DollarSign,
  Gavel,
  Users,
  TrendingUp,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  Timer,
  Target
} from "lucide-react"
import { startAuction, closeAuction, placeBid } from "@/lib/auction-actions"
import { useRouter } from "next/navigation"

interface LotData {
  id: string
  lotNumber: string
  fishType: string
  weight: number
  status: string
  supplier: {
    user: { email: string }
  }
  auction?: {
    id: string
    auctionNumber: string
    status: string
    startPrice: number
    currentPrice: number
    startTime: string
    endTime: string
    winningBidId?: string
    bids: BidData[]
  } | null
}

interface BidData {
  id: string
  bidNumber: string
  amount: number
  buyerUser: {
    name: string
    email: string
  }
  isWinning: boolean
  createdAt: string
}

interface AuctionPanelProps {
  lot: LotData
  userRole: string
  isLotOwner: boolean
}

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
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`
  } else {
    return `${seconds}s remaining`
  }
}

const getAuctionStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'ACTIVE':
      return 'bg-green-100 text-green-800'
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function AuctionPanel({ lot, userRole, isLotOwner }: AuctionPanelProps) {
  const [timeRemaining, setTimeRemaining] = useState("")
  const [bidAmount, setBidAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  const isBroker = userRole === 'BROKER'
  const isBuyer = userRole === 'BUYER'
  const hasAuction = !!lot.auction

  // Update countdown timer
  useEffect(() => {
    if (hasAuction && lot.auction && lot.auction.status === 'ACTIVE') {
      const timer = setInterval(() => {
        setTimeRemaining(formatTimeRemaining(lot.auction!.endTime))
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [hasAuction, lot.auction])

  const handleStartAuction = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const result = await startAuction(lot.id)
      
      if (result.success) {
        setSuccess("Auction started successfully!")
        router.refresh()
      } else {
        setError(result.error || "Failed to start auction")
      }
    } catch (err) {
      console.error('Start auction error:', err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseAuction = async () => {
    if (!lot.auction) return
    
    try {
      setIsLoading(true)
      setError("")
      
      const result = await closeAuction(lot.auction.id)
      
      if (result.success) {
        setSuccess("Auction closed successfully!")
        router.refresh()
      } else {
        setError(result.error || "Failed to close auction")
      }
    } catch (err) {
      console.error('Close auction error:', err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlaceBid = async () => {
    if (!lot.auction) return
    
    if (!bidAmount) {
      setError("Please enter a bid amount")
      return
    }

    const amount = parseFloat(bidAmount) * 100 // Convert to centavos
    const minAmount = lot.auction.currentPrice + 500

    if (amount < minAmount) {
      setError(`Minimum bid is ${formatCurrency(minAmount)}`)
      return
    }

    try {
      setIsLoading(true)
      setError("")
      
      const result = await placeBid(lot.auction.id, amount)
      
      if (result.success) {
        setSuccess("Bid placed successfully!")
        setBidAmount("")
        router.refresh()
      } else {
        setError(result.error || "Failed to place bid")
      }
    } catch (err) {
      console.error('Place bid error:', err)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!hasAuction) {
    // No auction exists yet
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Auction Status
            </CardTitle>
            <CardDescription>
              No auction scheduled for this lot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This lot is available but no auction has been scheduled yet.
              </AlertDescription>
            </Alert>

            {isBroker && lot.status === 'AVAILABLE' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ready to start an auction for this lot?
                </p>
                <Button 
                  onClick={handleStartAuction}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? "Starting..." : "Start Auction"}
                </Button>
              </div>
            )}

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
          </CardContent>
        </Card>
      </div>
    )
  }

  const auction = lot.auction
  const isActive = auction?.status === 'ACTIVE'
  const isCompleted = auction?.status === 'COMPLETED'
  const isPending = auction?.status === 'PENDING'
  const hasEnded = isActive && auction && new Date() > new Date(auction.endTime)

  return (
    <div className="space-y-6">
      {/* Auction Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                {auction?.auctionNumber || 'No Auction'}
              </CardTitle>
              <CardDescription>
                {auction?.status === 'ACTIVE' ? 'Live Auction' : 
                 auction?.status === 'COMPLETED' ? 'Auction Completed' :
                 auction?.status === 'PENDING' ? 'Auction Scheduled' : 'Auction Status'}
              </CardDescription>
            </div>
            <Badge className={getAuctionStatusColor(auction?.status || 'PENDING')}>
              {auction?.status || 'PENDING'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Price Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Starting Price</label>
              <p className="text-lg font-bold flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {formatCurrency(auction?.startPrice || 0)}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Current Price</label>
              <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                {formatCurrency(auction?.currentPrice || 0)}
              </p>
            </div>
          </div>

          {/* Time Information */}
          {isActive && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Time Remaining</span>
                </div>
                <span className="text-lg font-bold text-green-800">
                  {timeRemaining}
                </span>
              </div>
            </div>
          )}

          {isCompleted && lot.status === 'PENDING_SUPPLIER_APPROVAL' && (
            <Alert className="border-purple-200 bg-purple-50">
              <Clock className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                Auction completed. Awaiting supplier approval for final sale.
              </AlertDescription>
            </Alert>
          )}

          {/* Auction Controls */}
          {isBroker && (
            <div className="space-y-2">
              {isPending && (
                <Button 
                  onClick={handleStartAuction}
                  disabled={isLoading}
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? "Starting..." : "Start Auction Now"}
                </Button>
              )}
              
              {(isActive || hasEnded) && (
                <Button 
                  onClick={handleCloseAuction}
                  disabled={isLoading}
                  variant="destructive"
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {isLoading ? "Closing..." : "Close Auction"}
                </Button>
              )}
            </div>
          )}

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
        </CardContent>
      </Card>

      {/* Bidding Section */}
      {isActive && isBuyer && auction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Place Your Bid
            </CardTitle>
            <CardDescription>
              Minimum bid: {formatCurrency(auction.currentPrice + 500)} (current + $5.00)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bid Amount ($)</label>
              <Input
                type="number"
                placeholder={((auction.currentPrice + 500) / 100).toFixed(0)}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                min={(auction.currentPrice + 500) / 100}
                step="1"
              />
            </div>
            
            <Button 
              onClick={handlePlaceBid}
              disabled={isLoading || !bidAmount}
              className="w-full"
            >
              <Target className="h-4 w-4 mr-2" />
              Place Bid
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Bidding History */}
      {auction?.bids && auction.bids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Bidding History
            </CardTitle>
            <CardDescription>
              {auction.bids.length} bid{auction.bids.length !== 1 ? 's' : ''} placed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {auction.bids.map((bid: BidData) => (
                <div 
                  key={bid.id} 
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    bid.isWinning ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div>
                    <p className="font-medium">{bid.buyerUser.name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(bid.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${bid.isWinning ? 'text-green-600' : ''}`}>
                      {formatCurrency(bid.amount)}
                    </p>
                    {bid.isWinning && (
                      <Badge className="bg-green-100 text-green-800">
                        Winning Bid
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supplier Approval Section */}
      {lot.status === 'PENDING_SUPPLIER_APPROVAL' && isLotOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Approve Sale
            </CardTitle>
            <CardDescription>
              Review and approve the winning bid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="space-y-2">
                <p className="font-medium">Winning Bid Details:</p>
                <div className="text-sm space-y-1">
                  <p>Buyer: <span className="font-medium">{auction?.bids?.[0]?.buyerUser.name}</span></p>
                  <p>Amount: <span className="font-medium">{formatCurrency(auction?.currentPrice || 0)}</span></p>
                  <p>Per kg: <span className="font-medium">{formatCurrency(Math.round((auction?.currentPrice || 0) / lot.weight))}</span></p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve Sale
              </Button>
              <Button variant="outline" className="flex-1">
                Request Negotiation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
