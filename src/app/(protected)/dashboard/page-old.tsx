import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Gavel, 
  Fish, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import Link from "next/link"

type BrokerStats = {
  activeAuctions: number
  totalRevenue: number
  commissionEarned: number
  dailyTransactions: number
}

type SupplierStats = {
  activeLots: number
  pendingPayments: number
  soldLots: number
  totalWeight: number
}

type BuyerStats = {
  activeBids: number
  wonAuctions: number
  totalSpent: number
  pendingPayments: number
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const userRole = session?.user.role

  // Mock data - in real app, fetch from database
  const stats = {
    BROKER: {
      activeAuctions: 5,
      totalRevenue: 245000, // in centavos
      commissionEarned: 14700,
      dailyTransactions: 12
    } as BrokerStats,
    SUPPLIER: {
      activeLots: 3,
      pendingPayments: 85000,
      soldLots: 8,
      totalWeight: 245.5
    } as SupplierStats,
    BUYER: {
      activeBids: 4,
      wonAuctions: 2,
      totalSpent: 120000,
      pendingPayments: 35000
    } as BuyerStats
  }

  const roleStats = userRole ? stats[userRole as keyof typeof stats] : null

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  const getRoleColor = (role?: string) => {
    switch (role?.toUpperCase()) {
      case 'BROKER':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SUPPLIER':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'BUYER':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user.name || 'User'}
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your fish auction platform today
          </p>
        </div>
        <Badge variant="outline" className={getRoleColor(session?.user.role)}>
          {session?.user.role}
        </Badge>
      </div>

      {/* Role-specific Stats */}
      {userRole === 'BROKER' && roleStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Auctions</CardTitle>
              <Gavel className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as BrokerStats).activeAuctions}</div>
              <p className="text-xs text-muted-foreground">+2 from yesterday</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency((roleStats as BrokerStats).totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">+12% from last week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency((roleStats as BrokerStats).commissionEarned)}</div>
              <p className="text-xs text-muted-foreground">6% commission rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Daily Transactions</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as BrokerStats).dailyTransactions}</div>
              <p className="text-xs text-muted-foreground">Across all auctions</p>
            </CardContent>
          </Card>
        </div>
      )}

      {userRole === 'SUPPLIER' && roleStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Lots</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as SupplierStats).activeLots}</div>
              <p className="text-xs text-muted-foreground">Currently in auction</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency((roleStats as SupplierStats).pendingPayments)}</div>
              <p className="text-xs text-muted-foreground">Awaiting settlement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lots Sold</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as SupplierStats).soldLots}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
              <Fish className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as SupplierStats).totalWeight} kg</div>
              <p className="text-xs text-muted-foreground">Fish sold this month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {userRole === 'BUYER' && roleStats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bids</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as BuyerStats).activeBids}</div>
              <p className="text-xs text-muted-foreground">In live auctions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Won Auctions</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(roleStats as BuyerStats).wonAuctions}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency((roleStats as BuyerStats).totalSpent)}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency((roleStats as BuyerStats).pendingPayments)}</div>
              <p className="text-xs text-muted-foreground">Due for settlement</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity and Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your auctions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                <Gavel className="h-4 w-4 text-blue-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">New bid on Tuna Lot #001</p>
                <p className="text-sm text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Auction completed for Salmon Lot #003</p>
                <p className="text-sm text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100">
                <DollarSign className="h-4 w-4 text-orange-600" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Payment processed for Lot #002</p>
                <p className="text-sm text-muted-foreground">1 hour ago</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {userRole === 'BROKER' && (
              <>
                <Button className="w-full justify-start" asChild>
                  <Link href="/auctions/create">
                    <Gavel className="mr-2 h-4 w-4" />
                    Start New Auction
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/reports/daily">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Daily Report
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/settlements">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Process Settlements
                  </Link>
                </Button>
              </>
            )}

            {userRole === 'SUPPLIER' && (
              <>
                <Button className="w-full justify-start" asChild>
                  <Link href="/lots/create">
                    <Package className="mr-2 h-4 w-4" />
                    Add New Fish Lot
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/my-lots">
                    <Fish className="mr-2 h-4 w-4" />
                    View My Lots
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/settlements">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Check Payments
                  </Link>
                </Button>
              </>
            )}

            {userRole === 'BUYER' && (
              <>
                <Button className="w-full justify-start" asChild>
                  <Link href="/auctions">
                    <Gavel className="mr-2 h-4 w-4" />
                    Browse Auctions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/my-bids">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    My Active Bids
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/transactions">
                    <Clock className="mr-2 h-4 w-4" />
                    Transaction History
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
