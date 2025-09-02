#!/bin/bash

# Fish Auction System - Production Deployment Script
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
APP_NAME="fish-auction"
BACKUP_DIR="./backups"

echo "🚀 Starting deployment for environment: $ENVIRONMENT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Check if required environment file exists
ENV_FILE=".env.${ENVIRONMENT}"
if [ ! -f "$ENV_FILE" ]; then
    print_error "Environment file $ENV_FILE not found. Please create it based on .env.example"
fi

# Load environment variables
set -o allexport
source "$ENV_FILE"
set +o allexport

print_status "Loaded environment variables from $ENV_FILE"

# Validate required environment variables
required_vars=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in $ENV_FILE"
    fi
done

print_status "Environment variables validated"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# 1. Backup database (if in production)
if [ "$ENVIRONMENT" = "production" ]; then
    print_warning "Creating database backup before deployment..."
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if command -v pg_dump &> /dev/null; then
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE" || print_warning "Database backup failed, continuing..."
        print_status "Database backup created: $BACKUP_FILE"
    else
        print_warning "pg_dump not found, skipping database backup"
    fi
fi

# 2. Stop existing application (PM2)
if command -v pm2 &> /dev/null; then
    pm2 stop "$APP_NAME" || print_warning "PM2 app not running or not found"
fi

# 3. Install dependencies
print_status "Installing dependencies..."
npm ci --production=false

# 4. Generate Prisma client
print_status "Generating Prisma client..."
npm run db:generate

# 5. Run database migrations
print_status "Running database migrations..."
npm run db:deploy

# 6. Run tests (skip in production if desired)
if [ "$ENVIRONMENT" != "production" ] || [ "${SKIP_TESTS:-false}" != "true" ]; then
    print_status "Running tests..."
    npm run test:run || print_error "Tests failed! Deployment aborted."
fi

# 7. Build application
print_status "Building application..."
npm run build

# 8. Seed database (production-safe)
print_status "Seeding database with essential data..."
npm run db:seed:prod

# 9. Start application
if command -v pm2 &> /dev/null; then
    print_status "Starting application with PM2..."
    pm2 start ecosystem.config.js --env "$ENVIRONMENT"
    pm2 save
else
    print_status "Starting application with npm..."
    npm start &
    APP_PID=$!
    echo $APP_PID > app.pid
fi

# 10. Health check
print_status "Waiting for application to start..."
sleep 10

# Try health check multiple times
for i in {1..5}; do
    if curl -f "${NEXTAUTH_URL}/api/health" > /dev/null 2>&1; then
        print_status "Health check passed!"
        break
    elif [ $i -eq 5 ]; then
        print_error "Health check failed after 5 attempts"
    else
        print_warning "Health check attempt $i/5 failed, retrying in 10s..."
        sleep 10
    fi
done

# 11. Display deployment information
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Application: $NEXTAUTH_URL"
echo "   Health Check: $NEXTAUTH_URL/api/health"
echo "   Backup: ${BACKUP_FILE:-"None created"}"
echo ""

if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔐 Production Checklist:"
    echo "   □ SSL certificates configured"
    echo "   □ Domain DNS pointing to server"  
    echo "   □ Firewall rules configured"
    echo "   □ Monitoring alerts configured"
    echo "   □ Backup schedule confirmed"
    echo ""
fi

print_status "Deployment script completed!"

# Optional: Run post-deployment tests
if [ "${RUN_E2E_TESTS:-false}" = "true" ]; then
    print_status "Running end-to-end tests..."
    # Add your e2e test command here
    # npm run test:e2e || print_warning "E2E tests failed"
fi
