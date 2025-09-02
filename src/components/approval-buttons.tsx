"use client"

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { approveLotSale, rejectLotSale } from '@/lib/auction-actions'
import { useRouter } from 'next/navigation'

interface ApprovalButtonsProps {
  lotId: string
  winningBidAmount?: number
  winningBuyerName?: string
  userRole: string
  isLotOwner: boolean
}

export function ApprovalButtons({ 
  lotId, 
  winningBidAmount, 
  winningBuyerName, 
  userRole,
  isLotOwner 
}: ApprovalButtonsProps) {
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Only show for suppliers who own the lot
  if (userRole !== 'SUPPLIER' || !isLotOwner) {
    return null
  }

  const handleApprove = async () => {
    if (isApproving || isRejecting) return

    setIsApproving(true)
    setError(null)
    setMessage(null)

    try {
      const result = await approveLotSale(lotId)
      
      if (result.success) {
        setMessage(result.message || 'Sale approved successfully')
        // Refresh the page to show updated status
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setError(result.error || 'Failed to approve sale')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error approving sale:', err)
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    if (isApproving || isRejecting) return

    setIsRejecting(true)
    setError(null)
    setMessage(null)

    try {
      const result = await rejectLotSale(lotId)
      
      if (result.success) {
        setMessage(result.message || 'Sale rejected successfully')
        // Refresh the page to show updated status
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        setError(result.error || 'Failed to reject sale')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Error rejecting sale:', err)
    } finally {
      setIsRejecting(false)
    }
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Clock className="h-5 w-5" />
          Supplier Approval Required
        </CardTitle>
        <CardDescription>
          Your lot has received a winning bid and is awaiting your approval to complete the sale.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {winningBidAmount && winningBuyerName && (
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="text-sm text-gray-600 mb-1">Winning Bid</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(winningBidAmount)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Buyer: <span className="font-medium">{winningBuyerName}</span>
            </div>
          </div>
        )}

        {message && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="text-green-800 text-sm font-medium">{message}</div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <div className="text-red-800 text-sm font-medium">{error}</div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Sale
              </>
            )}
          </Button>

          <Button
            onClick={handleReject}
            disabled={isApproving || isRejecting}
            variant="destructive"
            className="flex-1"
          >
            {isRejecting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Reject Sale
              </>
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
          <div className="font-medium mb-2">What happens next:</div>
          <ul className="space-y-1">
            <li>• <strong>Approve:</strong> Creates a transaction record and marks the lot as sold</li>
            <li>• <strong>Reject:</strong> Returns the lot to available status for relisting</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
