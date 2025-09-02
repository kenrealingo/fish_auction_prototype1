#!/usr/bin/env bash
# Quick setup script for Fish Auction Platform

echo "🐟 Setting up Fish Auction Platform..."

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate

# Note: User needs to set up database first
echo ""
echo "⚠️  IMPORTANT: Before running migrations and seeds, make sure to:"
echo "   1. Set up your PostgreSQL database"
echo "   2. Update the DATABASE_URL in .env file"
echo "   3. Then run:"
echo "      pnpm db:migrate"
echo "      pnpm db:seed"
echo ""
echo "🚀 Then start the development server with:"
echo "   pnpm dev"
echo ""
echo "📧 Default login credentials:"
echo "   Email: broker@example.com"
echo "   Password: password123"
