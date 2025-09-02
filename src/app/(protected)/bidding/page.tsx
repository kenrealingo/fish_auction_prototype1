import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { BiddingDashboard } from "@/components/bidding-dashboard"
import { redirect } from "next/navigation"

export default async function BiddingPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Live Bidding</h1>
        <p className="text-gray-600 mt-2">
          Place bids on active auctions and track live bidding activity
        </p>
      </div>

      <BiddingDashboard 
        userRole={session.user.role || 'BUYER'} 
        userEmail={session.user.email || ''}
      />
    </div>
  )
}
