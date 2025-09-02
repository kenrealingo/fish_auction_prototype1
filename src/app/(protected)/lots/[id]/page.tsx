import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Fish,
  Calendar,
  Weight,
  DollarSign,
  User,
  Ship,
  MapPin,
  Star,
  Thermometer,
  Package,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
// import { ApprovalButtonsClient } from "@/components/approval-buttons-client"
// import { AuctionPanel } from "@/components/auction-panel"
// import { ApprovalButtons } from "@/components/approval-buttons"

// Mock data - in real app, fetch from database
const mockLotData = {
  "lot1": {
    id: "lot1",
    lotNumber: "LOT-20250901-001",
    fishType: "Atlantic Salmon",
    fishSpecies: "Salmo salar",
    weight: 28.5,
    grade: "A",
    freshness: "Fresh",
    origin: "Atlantic Ocean",
    status: "IN_AUCTION",
    reservePrice: 142500,
    description: "Premium quality Atlantic salmon, Grade A. Caught using sustainable fishing methods in pristine Atlantic waters.",
    caughtAt: "2025-08-30T06:00:00",
    createdAt: "2025-08-30T10:00:00",
    updatedAt: "2025-09-01T08:00:00",
    supplier: {
      id: "sup1",
      user: {
        name: "Atlantic Fisheries",
        email: "atlantic@example.com",
        phone: "+1-555-0101"
      },
      vesselName: "Ocean Breeze",
      vesselNumber: "VN-2024-001",
      licenseNumber: "LIC-2024-001",
      fishingArea: "Atlantic Ocean - Zone 21"
    },
    auction: {
      id: "auc1",
      auctionNumber: "AUC-20250901-001",
      status: "ACTIVE",
      startPrice: 114000,
      currentPrice: 128250,
      startTime: "2025-09-01T08:00:00",
      endTime: "2025-09-01T16:00:00",
      duration: 28800,
      bids: [
        {
          id: "bid1",
          bidNumber: "BID-20250901-001",
          amount: 128250,
          buyerUser: { 
            name: "Ocean Fresh Restaurants",
            email: "ocean@example.com"
          },
          isWinning: true,
          createdAt: "2025-09-01T14:30:00"
        },
        {
          id: "bid2",
          bidNumber: "BID-20250901-002",
          amount: 125000,
          buyerUser: { 
            name: "Harbor Market Chain",
            email: "harbor@example.com"
          },
          isWinning: false,
          createdAt: "2025-09-01T13:15:00"
        },
        {
          id: "bid3",
          bidNumber: "BID-20250901-003",
          amount: 120000,
          buyerUser: { 
            name: "Wholesale Fish Co.",
            email: "wholesale@example.com"
          },
          isWinning: false,
          createdAt: "2025-09-01T12:00:00"
        }
      ]
    }
  },
  "lot2": {
    id: "lot2",
    lotNumber: "LOT-20250901-002",
    fishType: "Red Snapper",
    fishSpecies: "Lutjanus campechanus",
    weight: 22.0,
    grade: "A+",
    freshness: "Ice Fresh",
    origin: "Gulf Waters",
    status: "AVAILABLE",
    reservePrice: 198000,
    description: "Excellent red snapper, premium grade. Perfect for high-end restaurants.",
    caughtAt: "2025-08-31T04:30:00",
    createdAt: "2025-08-31T08:00:00",
    updatedAt: "2025-08-31T08:00:00",
    supplier: {
      id: "sup2",
      user: {
        name: "Gulf Coast Fishing",
        email: "gulfcoast@example.com",
        phone: "+1-555-0102"
      },
      vesselName: "Sea Hunter",
      vesselNumber: "VN-2024-002",
      licenseNumber: "LIC-2024-002",
      fishingArea: "Gulf of Mexico - Zone 10"
    },
    auction: null
  },
  "lot3": {
    id: "lot3",
    lotNumber: "LOT-20250901-003",
    fishType: "Yellowfin Tuna",
    fishSpecies: "Thunnus albacares",
    weight: 45.2,
    grade: "A",
    freshness: "Fresh",
    origin: "Pacific Coast",
    status: "PENDING_SUPPLIER_APPROVAL",
    reservePrice: 678000,
    description: "Large yellowfin tuna, sashimi grade. Exceptional quality for premium sushi preparation.",
    caughtAt: "2025-08-30T05:15:00",
    createdAt: "2025-08-30T09:30:00",
    updatedAt: "2025-09-01T14:00:00",
    supplier: {
      id: "sup3",
      user: {
        name: "Pacific Tuna Co.",
        email: "pacific@example.com",
        phone: "+1-555-0103"
      },
      vesselName: "Deep Sea",
      vesselNumber: "VN-2024-003",
      licenseNumber: "LIC-2024-003",
      fishingArea: "Pacific Ocean - Zone 87"
    },
    auction: {
      id: "auc3",
      auctionNumber: "AUC-20250901-003",
      status: "COMPLETED",
      startPrice: 542400,
      currentPrice: 678000,
      startTime: "2025-09-01T10:00:00",
      endTime: "2025-09-01T14:00:00",
      duration: 14400,
      bids: [
        {
          id: "bid4",
          bidNumber: "BID-20250901-004",
          amount: 678000,
          buyerUser: { 
            name: "Sushi Master Restaurant",
            email: "sushi@example.com"
          },
          isWinning: true,
          createdAt: "2025-09-01T13:45:00"
        },
        {
          id: "bid5",
          bidNumber: "BID-20250901-005",
          amount: 650000,
          buyerUser: { 
            name: "Premium Seafood Inc.",
            email: "premium@example.com"
          },
          isWinning: false,
          createdAt: "2025-09-01T13:30:00"
        }
      ]
    }
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-blue-100 text-blue-800'
    case 'IN_AUCTION':
      return 'bg-green-100 text-green-800'
    case 'SOLD':
      return 'bg-gray-100 text-gray-800'
    case 'UNSOLD':
      return 'bg-yellow-100 text-yellow-800'
    case 'WITHDRAWN':
      return 'bg-red-100 text-red-800'
    case 'PENDING_SUPPLIER_APPROVAL':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const formatCurrency = (centavos: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default async function LotDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  const lot = mockLotData[params.id as keyof typeof mockLotData]
  
  if (!lot) {
    notFound()
  }

  const userRole = session.user.role
  const isSupplier = userRole === 'SUPPLIER'
  const isBroker = userRole === 'BROKER'
  const isLotOwner = isSupplier && lot.supplier.user.email === session.user.email

  // Suppress unused variable warning
  console.log('User is buyer:', userRole === 'BUYER')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{lot.lotNumber}</h1>
            <Badge className={getStatusColor(lot.status)}>
              {lot.status.replace('_', ' ')}
            </Badge>
          </div>
          <p className="text-gray-600">
            {lot.fishType} • {lot.weight} kg • Grade {lot.grade}
          </p>
        </div>
        
        {(isBroker || isLotOwner) && (
          <div className="flex gap-2">
            <Link href={`/lots/${lot.id}/edit`}>
              <Button variant="outline">
                Edit Lot
              </Button>
            </Link>
            <Link href="/lots">
              <Button variant="outline">
                Back to Lots
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Lot Details */}
        <div className="space-y-6">
          {/* Fish Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fish className="h-5 w-5" />
                Fish Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="text-sm font-medium">{lot.fishType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Species</label>
                  <p className="text-sm font-medium">{lot.fishSpecies}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Weight</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Weight className="h-4 w-4" />
                    {lot.weight} kg
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Grade</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {lot.grade}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Freshness</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    {lot.freshness}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Origin</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {lot.origin}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-sm">{lot.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Reserve Price</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(lot.reservePrice)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Caught Date</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatDate(lot.caughtAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Company</label>
                <p className="text-sm font-medium">{lot.supplier.user.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Vessel</label>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Ship className="h-4 w-4" />
                    {lot.supplier.vesselName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">License</label>
                  <p className="text-sm font-medium">{lot.supplier.licenseNumber}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Fishing Area</label>
                <p className="text-sm font-medium">{lot.supplier.fishingArea}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Contact</label>
                <p className="text-sm">{lot.supplier.user.email}</p>
                {lot.supplier.user.phone && (
                  <p className="text-sm">{lot.supplier.user.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Lot Status & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lot Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Lot Created</p>
                    <p className="text-xs text-gray-500">{formatDate(lot.createdAt)}</p>
                  </div>
                </div>
                
                {lot.auction && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Auction Started</p>
                      <p className="text-xs text-gray-500">{formatDate(lot.auction.startTime)}</p>
                    </div>
                  </div>
                )}
                
                {lot.status === 'PENDING_SUPPLIER_APPROVAL' && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Pending Supplier Approval</p>
                      <p className="text-xs text-gray-500">Awaiting final confirmation</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Auction Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Auction Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Auction information would be displayed here.</p>
            </CardContent>
          </Card>
          
          {/* Approval Buttons for Pending Supplier Approval */}
          {lot.status === 'PENDING_SUPPLIER_APPROVAL' && isLotOwner && userRole === 'SUPPLIER' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Clock className="h-5 w-5" />
                  Supplier Approval Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {lot.auction?.bids?.find(bid => bid.isWinning) && (
                  <div className="p-4 bg-white rounded-lg border">
                    <div className="text-sm text-gray-600">Winning Bid</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(lot.auction.bids.find(bid => bid.isWinning)?.amount || 0)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Buyer: {lot.auction.bids.find(bid => bid.isWinning)?.buyerUser?.name}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve Sale
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Sale
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
                  <strong>Approve:</strong> Creates transaction record and marks lot as sold<br/>
                  <strong>Reject:</strong> Returns lot to available status
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
