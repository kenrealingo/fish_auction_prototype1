import { NextRequest, NextResponse } from 'next/server'
import { logger, logApiCall } from './logger'
import { randomUUID } from 'crypto'

// API route wrapper with request ID and logging
export function withApiLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return logApiCall('API', 'route', async (req: NextRequest) => {
    const requestId = randomUUID()
    logger.setRequestId(requestId)
    
    // Add request ID to response headers for debugging
    const response = await handler(req)
    response.headers.set('X-Request-ID', requestId)
    
    return response
  })
}

// Server action wrapper with request ID
export function withServerActionLogging<T extends any[], R>(
  action: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    const requestId = randomUUID()
    logger.setRequestId(requestId)
    
    return action(...args)
  }
}

// Middleware for extracting user context from request
export function getUserContext(req: any) {
  // Extract user information from request
  // This would typically come from session/JWT token
  return {
    userId: req.user?.id,
    ipAddress: req.ip || req.connection?.remoteAddress || 'unknown',
    userAgent: req.headers?.['user-agent'] || 'unknown',
  }
}

// Health check endpoint with logging
export async function createHealthCheck() {
  return withApiLogging(async (req: NextRequest) => {
    const requestId = logger.getRequestId()
    
    logger.info('Health check requested', {
      requestId,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent')
      }
    })

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      requestId,
    }

    return NextResponse.json(health)
  })
}
