"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Users,
  Download,
  Printer,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw
} from "lucide-react"
import { formatMoney } from "@/lib/utils"
import { getDailyReport, exportDailyReportCSV } from "@/lib/reports-actions"

interface DailyReportData {
  date: string
  summary: {
    totalTransactions: number
    totalGrossAmount: number
    totalCommissions: number
    totalLaborFees: number
    totalNetAmount: number
    totalSettlements: number
    pendingSettlements: number
    completedSettlements: number
    pendingAmount: number
    completedAmount: number
  }
  transactions: Array<{
    id: string
    transactionNumber: string
    lotNumber: string
    fishType: string
    supplierName: string
    buyerName: string
    grossAmount: number
    commission: number
    laborFee: number
    netAmount: number
    createdAt: string
  }>
  settlements: Array<{
    id: string
    settlementNumber: string
    supplierName: string
    amount: number
    status: string
    createdAt: string
    completedAt: string | null
  }>
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

export default function DailyReportsPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))
  const [reportData, setReportData] = useState<DailyReportData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const loadReport = async (date: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getDailyReport(date)
      
      if (result.success && result.data) {
        setReportData(result.data)
      } else {
        setError(result.error || 'Failed to load report')
        setReportData(null)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setReportData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    
    try {
      const result = await exportDailyReportCSV(selectedDate)
      
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `daily-report-${selectedDate}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setError(result.error || 'Failed to export CSV')
      }
    } catch (err) {
      setError('An unexpected error occurred during export')
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      PENDING: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Load report on component mount and when date changes
  useEffect(() => {
    loadReport(selectedDate)
  }, [selectedDate])

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start print:flex-col print:space-y-2">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-600">
            View daily transaction and settlement summaries
          </p>
        </div>
        
        {/* Controls - Hidden when printing */}
        <div className="flex items-center gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <Label htmlFor="date-picker">Date:</Label>
            <Input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          
          <Button 
            onClick={() => loadReport(selectedDate)} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            )}
          </Button>

          <Button 
            onClick={handleExportCSV}
            disabled={!reportData || exporting}
            variant="outline"
            size="sm"
          >
            {exporting ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>

          <Button 
            onClick={handlePrint}
            disabled={!reportData}
            variant="outline"
            size="sm"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Report Date Display */}
      {reportData && (
        <Card className="print:shadow-none print:border-0">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <h2 className="text-2xl font-bold">Report for {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Generated on {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 print:hidden">
          <CardContent className="pt-6">
            <div className="text-red-800">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mr-3" />
            <span className="text-lg">Loading report data...</span>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {reportData && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Financial Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 print:grid-cols-4 print:gap-2">
            <StatCard
              title="Total Transactions"
              value={reportData.summary.totalTransactions.toString()}
              description="Sales completed today"
              icon={FileText}
            />
            
            <StatCard
              title="Gross Sales"
              value={formatMoney(reportData.summary.totalGrossAmount)}
              description="Total sale amounts"
              icon={DollarSign}
            />
            
            <StatCard
              title="Commissions Earned"
              value={formatMoney(reportData.summary.totalCommissions)}
              description={`${reportData.summary.totalGrossAmount > 0 ? ((reportData.summary.totalCommissions / reportData.summary.totalGrossAmount) * 100).toFixed(1) : '0'}% effective rate`}
              icon={TrendingUp}
            />
            
            <StatCard
              title="Labor Fees"
              value={formatMoney(reportData.summary.totalLaborFees)}
              description="Processing fees collected"
              icon={Users}
            />
          </div>

          {/* Settlement Summary */}
          <h3 className="text-xl font-semibold mb-4">Settlement Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 print:grid-cols-3 print:gap-2">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg text-green-800">Completed</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatMoney(reportData.summary.completedAmount)}
                </div>
                <CardDescription>
                  {reportData.summary.completedSettlements} settlements completed
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg text-orange-800">Pending</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {formatMoney(reportData.summary.pendingAmount)}
                </div>
                <CardDescription>
                  {reportData.summary.pendingSettlements} settlements pending
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-lg">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatMoney(reportData.summary.pendingAmount + reportData.summary.completedAmount)}
                </div>
                <CardDescription>
                  {reportData.summary.totalSettlements} settlements total
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      {reportData && reportData.transactions.length > 0 && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle>Transactions ({reportData.transactions.length})</CardTitle>
            <CardDescription>
              All sales transactions for {new Date(selectedDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="print:border-b-2">
                  <TableHead className="print:font-bold">Transaction #</TableHead>
                  <TableHead className="print:font-bold">Lot</TableHead>
                  <TableHead className="print:font-bold">Fish Type</TableHead>
                  <TableHead className="print:font-bold">Supplier</TableHead>
                  <TableHead className="print:font-bold">Buyer</TableHead>
                  <TableHead className="text-right print:font-bold">Gross</TableHead>
                  <TableHead className="text-right print:font-bold">Commission</TableHead>
                  <TableHead className="text-right print:font-bold">Labor Fee</TableHead>
                  <TableHead className="text-right print:font-bold">Net</TableHead>
                  <TableHead className="print:font-bold">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="print:border-b">
                    <TableCell className="font-mono text-xs">
                      {transaction.transactionNumber}
                    </TableCell>
                    <TableCell>{transaction.lotNumber}</TableCell>
                    <TableCell>{transaction.fishType}</TableCell>
                    <TableCell className="print:text-xs">{transaction.supplierName}</TableCell>
                    <TableCell className="print:text-xs">{transaction.buyerName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(transaction.grossAmount)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatMoney(transaction.commission)}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {formatMoney(transaction.laborFee)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatMoney(transaction.netAmount)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatDate(transaction.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Settlements Table */}
      {reportData && reportData.settlements.length > 0 && (
        <Card className="print:shadow-none print:border print:break-inside-avoid">
          <CardHeader>
            <CardTitle>Settlements ({reportData.settlements.length})</CardTitle>
            <CardDescription>
              All settlements created on {new Date(selectedDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="print:border-b-2">
                  <TableHead className="print:font-bold">Settlement #</TableHead>
                  <TableHead className="print:font-bold">Supplier</TableHead>
                  <TableHead className="text-right print:font-bold">Amount</TableHead>
                  <TableHead className="print:font-bold">Status</TableHead>
                  <TableHead className="print:font-bold">Created</TableHead>
                  <TableHead className="print:font-bold">Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.settlements.map((settlement) => (
                  <TableRow key={settlement.id} className="print:border-b">
                    <TableCell className="font-mono text-xs">
                      {settlement.settlementNumber}
                    </TableCell>
                    <TableCell>{settlement.supplierName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatMoney(settlement.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={getStatusBadge(settlement.status)}
                        variant="secondary"
                      >
                        {settlement.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatDate(settlement.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {settlement.completedAt ? formatDate(settlement.completedAt) : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {reportData && reportData.transactions.length === 0 && reportData.settlements.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data for selected date</h3>
            <p className="text-gray-500 text-center">
              There were no transactions or settlements on {new Date(selectedDate).toLocaleDateString()}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
