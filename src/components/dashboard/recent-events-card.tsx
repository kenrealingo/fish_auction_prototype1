import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { formatMoney } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { 
  Package, 
  Gavel, 
  TrendingUp, 
  CheckCircle,
  Clock
} from 'lucide-react'

interface RecentEvent {
  id: string
  type: 'LOT_CREATED' | 'BID_PLACED' | 'AUCTION_CLOSED' | 'TRANSACTION_CREATED'
  title: string
  description: string
  timestamp: string
  amount?: number
  lotNumber?: string
  fishType?: string
  supplierName?: string
  buyerName?: string
}

interface RecentEventsCardProps {
  events: RecentEvent[]
  className?: string
}

export function RecentEventsCard({ events, className }: RecentEventsCardProps) {
  const getEventIcon = (type: RecentEvent['type']) => {
    switch (type) {
      case 'LOT_CREATED':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'BID_PLACED':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />
      case 'AUCTION_CLOSED':
        return <Gavel className="h-4 w-4 text-red-600" />
      case 'TRANSACTION_CREATED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getEventColor = (type: RecentEvent['type']) => {
    switch (type) {
      case 'LOT_CREATED':
        return 'bg-blue-50 border-blue-200'
      case 'BID_PLACED':
        return 'bg-yellow-50 border-yellow-200'
      case 'AUCTION_CLOSED':
        return 'bg-red-50 border-red-200'
      case 'TRANSACTION_CREATED':
        return 'bg-green-50 border-green-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const eventTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - eventTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest events and transactions in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-3">
            {events.map((event) => (
              <div 
                key={event.id} 
                className={cn(
                  "flex items-start space-x-3 rounded-lg border p-3",
                  getEventColor(event.type)
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {event.description}
                      </p>
                      
                      {/* Event Details */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {event.lotNumber && (
                          <Badge variant="secondary" className="text-xs">
                            {event.lotNumber}
                          </Badge>
                        )}
                        {event.fishType && (
                          <Badge variant="outline" className="text-xs">
                            {event.fishType}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Amount */}
                      {event.amount && (
                        <p className="text-sm font-semibold text-green-700 mt-1">
                          {formatMoney(event.amount)}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 ml-2">
                      {formatTimeAgo(event.timestamp)}
                    </div>
                  </div>
                  
                  {/* Participants */}
                  <div className="mt-2 space-y-1">
                    {event.supplierName && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Supplier:</span> {event.supplierName}
                      </p>
                    )}
                    {event.buyerName && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Buyer:</span> {event.buyerName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
