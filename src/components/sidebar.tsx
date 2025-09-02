"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  Gavel,
  Fish,
  Users,
  TrendingUp,
  FileText,
  Settings,
  CreditCard,
  Package,
  BarChart3,
  Clock,
  DollarSign,
  ShoppingCart,
  Truck,
  Target,
} from "lucide-react"

interface SidebarProps {
  className?: string
}

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  roles?: string[]
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Live Auctions",
    href: "/auctions",
    icon: Gavel,
    badge: "3",
  },
  {
    title: "Live Bidding",
    href: "/bidding",
    icon: Target,
    badge: "2",
  },
  {
    title: "Fish Lots",
    href: "/lots",
    icon: Fish,
  },
  {
    title: "My Lots",
    href: "/my-lots",
    icon: Package,
    roles: ["SUPPLIER"],
  },
  {
    title: "My Bids",
    href: "/my-bids",
    icon: ShoppingCart,
    roles: ["BUYER"],
  },
  {
    title: "Suppliers",
    href: "/suppliers",
    icon: Truck,
    roles: ["BROKER"],
  },
  {
    title: "Buyers",
    href: "/buyers",
    icon: Users,
    roles: ["BROKER"],
  },
  {
    title: "Transactions",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    title: "Settlements",
    href: "/settlements",
    icon: DollarSign,
    roles: ["BROKER", "SUPPLIER"],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["BROKER"],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: TrendingUp,
  },
  {
    title: "Daily Reports",
    href: "/daily-reports",
    icon: FileText,
    roles: ["BROKER"],
  },
  {
    title: "Auction History",
    href: "/history",
    icon: Clock,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = session?.user?.role

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true // Show to all roles if no restriction
    return item.roles.includes(userRole || '')
  })

  return (
    <div className={cn("pb-12 w-64", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <ScrollArea className="h-[calc(100vh-8rem)]">
            <div className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start",
                      isActive && "bg-secondary font-medium"
                    )}
                    asChild
                  >
                    <Link href={item.href}>
                      <Icon className="mr-2 h-4 w-4" />
                      {item.title}
                      {item.badge && (
                        <Badge 
                          variant="secondary" 
                          className="ml-auto bg-red-100 text-red-800 text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Role-specific quick actions */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-sm font-semibold tracking-tight text-muted-foreground">
            Quick Actions
          </h2>
          <div className="space-y-1">
            {userRole === 'SUPPLIER' && (
              <>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/lots/create">
                    <Package className="mr-2 h-3 w-3" />
                    Add New Lot
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/settlements">
                    <DollarSign className="mr-2 h-3 w-3" />
                    View Payments
                  </Link>
                </Button>
              </>
            )}
            
            {userRole === 'BUYER' && (
              <>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/auctions/active">
                    <Gavel className="mr-2 h-3 w-3" />
                    Join Auction
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/my-bids">
                    <ShoppingCart className="mr-2 h-3 w-3" />
                    My Bids
                  </Link>
                </Button>
              </>
            )}
            
            {userRole === 'BROKER' && (
              <>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/auctions/create">
                    <Gavel className="mr-2 h-3 w-3" />
                    Start Auction
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
                  <Link href="/reports/daily">
                    <FileText className="mr-2 h-3 w-3" />
                    Daily Report
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Settings */}
        <div className="px-3 py-2">
          <div className="space-y-1">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
