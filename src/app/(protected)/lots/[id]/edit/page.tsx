import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { LotForm } from "@/components/lot-form"

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
    supplier: {
      user: { email: "atlantic@example.com" }
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
    supplier: {
      user: { email: "gulfcoast@example.com" }
    }
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
    supplier: {
      user: { email: "pacific@example.com" }
    }
  }
}

export default async function EditLotPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  const lot = mockLotData[params.id as keyof typeof mockLotData]
  
  if (!lot) {
    notFound()
  }

  const userRole = session.user.role
  const isSupplier = userRole === 'SUPPLIER'
  const isBroker = userRole === 'BROKER'
  const isLotOwner = isSupplier && lot.supplier.user.email === session.user.email

  // Check permissions
  if (!isBroker && !isLotOwner) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">You can only edit your own lots.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Lot</h1>
        <p className="text-gray-600 mt-1">
          Update lot information for {lot.lotNumber}
        </p>
      </div>

      <LotForm 
        initialData={lot}
        userRole={session.user.role}
        userEmail={session.user.email || ''}
        isEditing={true}
      />
    </div>
  )
}
