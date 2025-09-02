import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    console.log("Middleware: token exists?", !!req.nextauth.token)
    console.log("Middleware: pathname:", req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        console.log("Authorized callback: token exists?", !!token)
        console.log("Authorized callback: pathname:", req.nextUrl.pathname)
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ["/(protected)/:path*"]
}
