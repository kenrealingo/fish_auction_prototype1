import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getAllSuppliers } from "@/lib/supplier-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ship, Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const mockSuppliersData = [
  {
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
    lots: [
      { id: "lot1", status: "SOLD" },
      { id: "lot2", status: "AVAILABLE" }
    ]
  },
  {
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
    lots: [
      { id: "lot3", status: "PENDING_SUPPLIER_APPROVAL" }
    ]
  },
  {
    id: "supplier3",
    user: {
      id: "user3",
      name: "Gulf Coast Fishing",
      email: "gulfcoast@example.com",
      phone: "+1-555-0102"
    },
    vesselName: "Sea Hunter",
    vesselNumber: "VN-2024-002", 
    licenseNumber: "LIC-2024-002",
    fishingArea: "Gulf of Mexico - Zone 10",
    lots: [
      { id: "lot4", status: "AVAILABLE" },
      { id: "lot5", status: "IN_AUCTION" }
    ]
  }
]

export default async function SuppliersPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  // For now, use mock data. In production, use: await getAllSuppliers()
  const suppliers = mockSuppliersData

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-blue-100 text-blue-800'
      case 'IN_AUCTION':
        return 'bg-green-100 text-green-800'
      case 'SOLD':
        return 'bg-gray-100 text-gray-800'
      case 'PENDING_SUPPLIER_APPROVAL':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusCounts = (lots: Array<{status: string}>) => {
    return lots.reduce((acc, lot) => {
      acc[lot.status] = (acc[lot.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600">
            Manage supplier relationships and view performance metrics
          </p>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {suppliers.map((supplier) => {
          const statusCounts = getStatusCounts(supplier.lots)
          
          return (
            <Card key={supplier.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Ship className="h-5 w-5 text-blue-600" />
                      {supplier.user.name}
                    </CardTitle>
                    <CardDescription>
                      {supplier.vesselName} • {supplier.vesselNumber}
                    </CardDescription>
                  </div>
                  <Link href={`/suppliers/${supplier.id}`}>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {supplier.user.email}
                  </div>
                  {supplier.user.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {supplier.user.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {supplier.fishingArea}
                  </div>
                </div>

                {/* License Info */}
                <div className="text-sm">
                  <span className="font-medium">License:</span> {supplier.licenseNumber}
                </div>

                {/* Lot Status Summary */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Active Lots ({supplier.lots.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <Badge 
                        key={status}
                        className={getStatusColor(status)}
                        variant="secondary"
                      >
                        {status.replace('_', ' ')}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {suppliers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Ship className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500 text-center">
              Suppliers will appear here once they register and are approved.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
