import { getServerSession } from "next-auth/next"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fish Auction</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome to the fish auction platform
          </p>
        </div>
        <div>
          <Link href="/login">
            <Button className="w-full">
              Sign In to Continue
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
