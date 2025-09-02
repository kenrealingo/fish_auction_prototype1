import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Commented out for mock testing
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Mock users for testing (since database is not connected)
        const mockUsers = [
          {
            id: "broker1",
            email: "broker@example.com",
            password: "password123",
            name: "Main Broker",
            role: "BROKER",
          },
          {
            id: "supplier1", 
            email: "supplier1@example.com",
            password: "password123",
            name: "Atlantic Fisheries",
            role: "SUPPLIER",
          },
          {
            id: "buyer1",
            email: "buyer1@example.com", 
            password: "password123",
            name: "Ocean Fresh Markets",
            role: "BUYER",
          },
        ]

        const user = mockUsers.find(u => u.email === credentials.email)
        
        if (!user || user.password !== credentials.password) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: true, // Enable debug mode
  secret: process.env.NEXTAUTH_SECRET,
}
