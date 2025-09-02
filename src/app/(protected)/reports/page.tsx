import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Calendar,
  TrendingUp,
  Users,
  BarChart3
} from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">
          Generate and view comprehensive business reports
        </p>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Daily Reports */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Daily Reports
            </CardTitle>
            <CardDescription>
              View daily transaction summaries and settlement status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • Transaction summaries by date
              </div>
              <div className="text-sm text-gray-600">
                • Settlement tracking and status
              </div>
              <div className="text-sm text-gray-600">
                • Export to CSV and print functionality
              </div>
              <Link href="/reports/daily">
                <Button className="w-full mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  View Daily Reports
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Financial Analysis */}
        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Financial Analysis
            </CardTitle>
            <CardDescription>
              Analyze revenue trends and commission performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • Revenue trend analysis
              </div>
              <div className="text-sm text-gray-600">
                • Commission performance metrics
              </div>
              <div className="text-sm text-gray-600">
                • Monthly and yearly comparisons
              </div>
              <Button className="w-full mt-4" disabled>
                <TrendingUp className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Performance */}
        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Supplier Performance
            </CardTitle>
            <CardDescription>
              Track supplier activity and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • Sales volume by supplier
              </div>
              <div className="text-sm text-gray-600">
                • Quality and pricing trends
              </div>
              <div className="text-sm text-gray-600">
                • Settlement history
              </div>
              <Button className="w-full mt-4" disabled>
                <Users className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis */}
        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-orange-600" />
              Market Analysis
            </CardTitle>
            <CardDescription>
              Fish market trends and pricing analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • Fish type popularity trends
              </div>
              <div className="text-sm text-gray-600">
                • Price volatility analysis
              </div>
              <div className="text-sm text-gray-600">
                • Seasonal demand patterns
              </div>
              <Button className="w-full mt-4" disabled>
                <BarChart3 className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auction Analytics */}
        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Auction Analytics
            </CardTitle>
            <CardDescription>
              Bidding patterns and auction performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • Auction success rates
              </div>
              <div className="text-sm text-gray-600">
                • Bidding activity analysis
              </div>
              <div className="text-sm text-gray-600">
                • Time-to-sale metrics
              </div>
              <Button className="w-full mt-4" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom Reports */}
        <Card className="hover:shadow-md transition-shadow opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              Custom Reports
            </CardTitle>
            <CardDescription>
              Build custom reports with flexible parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                • Custom date ranges
              </div>
              <div className="text-sm text-gray-600">
                • Filter by supplier, buyer, or fish type
              </div>
              <div className="text-sm text-gray-600">
                • Multiple export formats
              </div>
              <Button className="w-full mt-4" disabled>
                <FileText className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common reporting tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/reports/daily">
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Today's Report
              </Button>
            </Link>
            <Button variant="outline" className="w-full" disabled>
              <TrendingUp className="h-4 w-4 mr-2" />
              This Month's Summary
            </Button>
            <Button variant="outline" className="w-full" disabled>
              <FileText className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
