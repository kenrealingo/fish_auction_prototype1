import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Package,
  Plus,
  Fish,
  Calendar,
  Weight,
  DollarSign,
  Clock,
  Eye,
  Edit
} from "lucide-react"
import Link from "next/link"

// Mock data - in real app, fetch from database
const mockLots = [
  {
    id: "lot1",
    lotNumber: "LOT-20250901-001",
    fishType: "Atlantic Salmon",
    fishSpecies: "Salmo salar",
    weight: 28.5,
    grade: "A",
    freshness: "Fresh",
    origin: "Atlantic Ocean",
    status: "IN_AUCTION",
    reservePrice: 142500, // 28.5kg * 5000 centavos/kg
    description: "Premium quality Atlantic salmon, Grade A",
    caughtAt: "2025-08-30T06:00:00",
    createdAt: "2025-08-30T10:00:00",
    supplier: {
      id: "sup1",
      user: {
        name: "Atlantic Fisheries",
        email: "atlantic@example.com"
      },
      vesselName: "Ocean Breeze",
      licenseNumber: "LIC-2024-001"
    },
    auction: {
      id: "auc1",
      auctionNumber: "AUC-20250901-001",
      status: "ACTIVE",
      startPrice: 114000,
      currentPrice: 128250,
      startTime: "2025-09-01T08:00:00",
      endTime: "2025-09-01T16:00:00",
      bids: [
        {
          id: "bid1",
          amount: 128250,
          buyerUser: { name: "Ocean Fresh Restaurants" },
          isWinning: true,
          createdAt: "2025-09-01T14:30:00"
        }
      ]
    }
  },
  {
    id: "lot2",
    lotNumber: "LOT-20250901-002",
    fishType: "Red Snapper",
    fishSpecies: "Lutjanus campechanus",
    weight: 22.0,
    grade: "A+",
    freshness: "Ice Fresh",
    origin: "Gulf Waters",
    status: "AVAILABLE",
    reservePrice: 198000, // 22kg * 9000 centavos/kg
    description: "Excellent red snapper, premium grade",
    caughtAt: "2025-08-31T04:30:00",
    createdAt: "2025-08-31T08:00:00",
    supplier: {
      id: "sup2",
      user: {
        name: "Gulf Coast Fishing",
        email: "gulfcoast@example.com"
      },
      vesselName: "Sea Hunter",
      licenseNumber: "LIC-2024-002"
    },
    auction: null
  },
  {
    id: "lot3",
    lotNumber: "LOT-20250901-003",
    fishType: "Yellowfin Tuna",
    fishSpecies: "Thunnus albacares",
    weight: 45.2,
    grade: "A",
    freshness: "Fresh",
    origin: "Pacific Coast",
    status: "PENDING_SUPPLIER_APPROVAL",
    reservePrice: 678000, // 45.2kg * 15000 centavos/kg
    description: "Large yellowfin tuna, sashimi grade",
    caughtAt: "2025-08-30T05:15:00",
    createdAt: "2025-08-30T09:30:00",
    supplier: {
      id: "sup3",
      user: {
        name: "Pacific Tuna Co.",
        email: "pacific@example.com"
      },
      vesselName: "Deep Sea",
      licenseNumber: "LIC-2024-003"
    },
    auction: {
      id: "auc3",
      auctionNumber: "AUC-20250901-003",
      status: "COMPLETED",
      startPrice: 542400,
      currentPrice: 678000,
      startTime: "2025-09-01T10:00:00",
      endTime: "2025-09-01T14:00:00",
      bids: [
        {
          id: "bid3",
          amount: 678000,
          buyerUser: { name: "Sushi Master Restaurant" },
          isWinning: true,
          createdAt: "2025-09-01T13:45:00"
        }
      ]
    }
  }
]

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
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(centavos / 100)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default async function LotsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  const userRole = session.user.role

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fish Lots</h1>
          <p className="text-gray-600 mt-1">
            Manage catch lots and auctions
          </p>
        </div>
        
        {(userRole === 'BROKER' || userRole === 'SUPPLIER') && (
          <Link href="/lots/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create New Lot
            </Button>
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lots</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Active lots</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Currently bidding</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(1018500)}</div>
            <p className="text-xs text-muted-foreground">Reserve prices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Fish className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Awaiting supplier</p>
          </CardContent>
        </Card>
      </div>

      {/* Lots List */}
      <div className="space-y-4">
        {mockLots.map((lot) => (
          <Card key={lot.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">{lot.lotNumber}</CardTitle>
                    <Badge className={getStatusColor(lot.status)}>
                      {lot.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Fish className="h-4 w-4" />
                      {lot.fishType} ({lot.fishSpecies})
                    </span>
                    <span className="flex items-center gap-1">
                      <Weight className="h-4 w-4" />
                      {lot.weight} kg
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Caught {formatDate(lot.caughtAt)}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href={`/lots/${lot.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  {(userRole === 'BROKER' || 
                    (userRole === 'SUPPLIER' && lot.supplier.user.email === session.user.email)) && (
                    <Link href={`/lots/${lot.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {/* Lot Details */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Lot Details</h4>
                  <div className="text-sm space-y-1">
                    <div>Grade: <span className="font-medium">{lot.grade}</span></div>
                    <div>Freshness: <span className="font-medium">{lot.freshness}</span></div>
                    <div>Origin: <span className="font-medium">{lot.origin}</span></div>
                    <div>Reserve Price: <span className="font-medium">{formatCurrency(lot.reservePrice)}</span></div>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Supplier</h4>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{lot.supplier.user.name}</div>
                    <div>Vessel: {lot.supplier.vesselName}</div>
                    <div>License: {lot.supplier.licenseNumber}</div>
                  </div>
                </div>

                {/* Auction Status */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Auction Status</h4>
                  {lot.auction ? (
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(lot.auction.status)}>
                          {lot.auction.status}
                        </Badge>
                      </div>
                      <div>Current Price: <span className="font-medium">{formatCurrency(lot.auction.currentPrice)}</span></div>
                      {lot.auction.bids.length > 0 && (
                        <div>Leading: {lot.auction.bids[0].buyerUser.name}</div>
                      )}
                      {lot.auction.status === 'ACTIVE' && (
                        <div>Ends: {formatDate(lot.auction.endTime)}</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No auction scheduled</div>
                  )}
                </div>
              </div>

              {lot.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600">{lot.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
