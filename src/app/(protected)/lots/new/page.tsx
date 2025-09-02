import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LotForm } from "@/components/lot-form"

export default async function CreateLotPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect("/login")
  }

  // Only brokers and suppliers can create lots
  if (session.user.role !== 'BROKER' && session.user.role !== 'SUPPLIER') {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-gray-600">Only brokers and suppliers can create new lots.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Lot</h1>
        <p className="text-gray-600 mt-1">
          Add a new fish lot to the auction system
        </p>
      </div>

      <LotForm 
        userRole={session.user.role}
        userEmail={session.user.email || ''}
      />
    </div>
  )
}
