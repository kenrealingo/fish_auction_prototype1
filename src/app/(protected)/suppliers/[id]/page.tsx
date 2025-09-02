import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getSupplierTotals } from "@/lib/supplier-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { formatMoney } from "@/lib/utils"
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Wrench, 
  Wallet,
  CheckCircle,
  Clock,
  FileText
} from "lucide-react"
import { notFound } from "next/navigation"

// Mock supplier data for now
const mockSupplierData = {
  "supplier1": {
    id: "supplier1",
    user: {
      id: "user1",
      name: "Atlantic Fisheries",
      email: "supplier1@example.com",
      phone: "+1-555-0101"
    },
    vesselName: "Ocean Breeze",
    vesselNumber: "VN-2024-001",
    licenseNumber: "LIC-2024-001",
    fishingArea: "Atlantic Ocean - Zone 21",
    createdAt: "2024-01-15T09:00:00Z"
  },
  "supplier2": {
    id: "supplier2", 
    user: {
      id: "user2",
      name: "Pacific Tuna Co.",
      email: "pacific@example.com",
      phone: "+1-555-0103"
    },
    vesselName: "Deep Sea",
    vesselNumber: "VN-2024-003",
    licenseNumber: "LIC-2024-003", 
    fishingArea: "Pacific Ocean - Zone 87",
    createdAt: "2024-02-20T10:00:00Z"
  }
}

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: React.ComponentType<any>
  trend?: {
    value: string
    isPositive: boolean
  }
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
        {trend && (
          <div className={`text-xs flex items-center mt-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default async function SupplierDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  const supplier = mockSupplierData[params.id as keyof typeof mockSupplierData]
  
  if (!supplier) {
    notFound()
  }

  // Get supplier totals
  const totalsResult = await getSupplierTotals(supplier.user.id)
  const totals = totalsResult.success ? totalsResult.data : {
    lifetimeGross: 0,
    totalCommissions: 0,
    totalLaborFees: 0,
    netPayouts: 0,
    transactionCount: 0,
    settledAmount: 0,
    pendingAmount: 0
  }

  // Check permissions
  const canView = session.user.role === 'BROKER' || 
                 (session.user.role === 'SUPPLIER' && session.user.email === supplier.user.email)

  if (!canView) {
    return <div>Access denied</div>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate effective commission rate
  const effectiveCommissionRate = (totals?.lifetimeGross || 0) > 0 
    ? (((totals?.totalCommissions || 0) / (totals?.lifetimeGross || 1)) * 100).toFixed(1)
    : '0.0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{supplier.user.name}</h1>
            <Badge variant="secondary">{supplier.user.email}</Badge>
          </div>
          <p className="text-gray-600">
            {supplier.vesselName} • {supplier.vesselNumber} • {supplier.fishingArea}
          </p>
        </div>
      </div>

      {/* Financial Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Lifetime Financial Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Lifetime Gross Sales"
            value={formatMoney(totals?.lifetimeGross || 0)}
            description={`From ${totals?.transactionCount || 0} completed sales`}
            icon={DollarSign}
          />
          
          <StatCard
            title="Total Commissions"
            value={formatMoney(totals?.totalCommissions || 0)}
            description={`${effectiveCommissionRate}% effective rate`}
            icon={Percent}
          />
          
          <StatCard
            title="Labor Fees"
            value={formatMoney(totals?.totalLaborFees || 0)}
            description="Processing and handling fees"
            icon={Wrench}
          />
          
          <StatCard
            title="Net Payouts"
            value={formatMoney(totals?.netPayouts || 0)}
            description="Total amount due to supplier"
            icon={Wallet}
          />
        </div>
      </div>

      {/* Settlement Status */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Settlement Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle className="text-lg text-green-800">Settled Amount</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatMoney(totals?.settledAmount || 0)}
              </div>
              <CardDescription>
                Payments completed and processed
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-lg text-orange-800">Pending Amount</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {formatMoney(totals?.pendingAmount || 0)}
              </div>
              <CardDescription>
                Awaiting payment processing
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Supplier Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Supplier Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Contact Information</p>
                <p className="text-sm">{supplier.user.email}</p>
                {supplier.user.phone && (
                  <p className="text-sm">{supplier.user.phone}</p>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Vessel Details</p>
                <p className="text-sm">{supplier.vesselName} ({supplier.vesselNumber})</p>
                <p className="text-sm">License: {supplier.licenseNumber}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Fishing Area</p>
                <p className="text-sm">{supplier.fishingArea}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Member Since</p>
                <p className="text-sm">{formatDate(supplier.createdAt)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Breakdown</CardTitle>
          <CardDescription>
            Detailed view of commissions and fees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Gross Sales</span>
              <span className="text-sm font-bold">{formatMoney(totals?.lifetimeGross || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm">Less: Commission (6%)</span>
              <span className="text-sm">-{formatMoney(totals?.totalCommissions || 0)}</span>
            </div>
            <div className="flex justify-between items-center text-red-600">
              <span className="text-sm">Less: Labor Fees</span>
              <span className="text-sm">-{formatMoney(totals?.totalLaborFees || 0)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold text-green-600">
              <span>Net Payouts</span>
              <span>{formatMoney(totals?.netPayouts || 0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
