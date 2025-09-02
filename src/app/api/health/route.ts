import { NextRequest, NextResponse } from 'next/server'
import { withApiLogging } from '@/lib/api-middleware'
import { logger } from '@/lib/logger'

/**
 * Health check endpoint for monitoring and load balancers
 * Returns basic system status with request tracking
 */
export const GET = withApiLogging(async (req: NextRequest) => {
  try {
    const requestId = logger.getRequestId()
    
    logger.info('Health check requested', {
      requestId,
      metadata: {
        method: req.method,
        url: req.url,
        userAgent: req.headers.get('user-agent')
      }
    })

    // Basic health check - can be extended to check database connectivity
    const health = {
      ok: true, 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      requestId,
    }

    return NextResponse.json(health)
  } catch (error) {
    logger.error('Health check failed', {
      metadata: { error }
    })
    
    return NextResponse.json(
      { ok: false, error: 'Health check failed' },
      { status: 500 }
    )
  }
})
