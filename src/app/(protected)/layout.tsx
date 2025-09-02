import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { TopNavigation } from "@/components/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { Suspense } from "react"
import { DashboardSkeleton } from "@/components/loading-skeletons"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Navigation */}
      <TopNavigation />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:fixed md:left-0 md:top-16 md:z-40 md:block md:h-[calc(100vh-4rem)] md:w-64 md:border-r md:bg-white md:shadow-sm">
          <Sidebar />
        </aside>
        
        {/* Mobile Sidebar with Main Content */}
        <MobileSidebar>
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <Suspense fallback={<DashboardSkeleton />}>
              {children}
            </Suspense>
          </div>
        </MobileSidebar>
      </div>
    </div>
  )
}
