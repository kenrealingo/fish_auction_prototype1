import { randomUUID } from 'crypto'

export interface LogContext {
  requestId?: string
  userId?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  requestId: string
  userId?: string
  action?: string
  resource?: string
  metadata?: Record<string, any>
  error?: string
  stack?: string
}

class Logger {
  private static instance: Logger
  private requestId: string = randomUUID()

  constructor() {
    if (Logger.instance) {
      return Logger.instance
    }
    Logger.instance = this
  }

  // Generate a new request ID for each request
  static generateRequestId(): string {
    return randomUUID()
  }

  // Set request ID for the current context
  setRequestId(requestId: string): void {
    this.requestId = requestId
  }

  // Get current request ID
  getRequestId(): string {
    return this.requestId
  }

  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: context.requestId || this.requestId,
      userId: context.userId,
      action: context.action,
      resource: context.resource,
      metadata: context.metadata,
    }

    // Add error details if provided
    if (context.metadata?.error instanceof Error) {
      entry.error = context.metadata.error.message
      entry.stack = context.metadata.error.stack
    }

    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production') {
      this.writeToProductionLog(entry)
    } else {
      this.writeToConsole(entry)
    }
  }

  private writeToConsole(entry: LogEntry): void {
    const levelColors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
    }

    const levelNames = {
      [LogLevel.DEBUG]: 'DEBUG',
      [LogLevel.INFO]: 'INFO',
      [LogLevel.WARN]: 'WARN',
      [LogLevel.ERROR]: 'ERROR',
    }

    const color = levelColors[entry.level]
    const levelName = levelNames[entry.level]
    const reset = '\x1b[0m'

    let logMessage = `${color}[${entry.timestamp}] ${levelName}${reset} [${entry.requestId.slice(0, 8)}...] ${entry.message}`

    if (entry.userId) {
      logMessage += ` | userId: ${entry.userId}`
    }

    if (entry.action) {
      logMessage += ` | action: ${entry.action}`
    }

    if (entry.resource) {
      logMessage += ` | resource: ${entry.resource}`
    }

    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      logMessage += ` | metadata: ${JSON.stringify(entry.metadata)}`
    }

    if (entry.error) {
      logMessage += `\n${color}Error: ${entry.error}${reset}`
    }

    if (entry.stack && entry.level === LogLevel.ERROR) {
      logMessage += `\n${entry.stack}`
    }

    console.log(logMessage)
  }

  private writeToProductionLog(entry: LogEntry): void {
    // In production, you might want to:
    // 1. Send to external logging service (e.g., DataDog, CloudWatch, etc.)
    // 2. Write to structured log files
    // 3. Send critical errors to alerting systems
    
    // For now, write structured JSON to stdout for container logging
    console.log(JSON.stringify(entry))
  }

  // Public logging methods
  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context)
  }

  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context)
  }

  error(message: string, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context)
  }

  // Convenience methods for common scenarios
  apiRequest(method: string, path: string, context: LogContext = {}): void {
    this.info(`API ${method} ${path}`, {
      ...context,
      action: 'api_request',
      resource: path,
      metadata: { method, ...context.metadata }
    })
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context: LogContext = {}): void {
    this.info(`API ${method} ${path} - ${statusCode} (${duration}ms)`, {
      ...context,
      action: 'api_response',
      resource: path,
      metadata: { method, statusCode, duration, ...context.metadata }
    })
  }

  serverAction(action: string, context: LogContext = {}): void {
    this.info(`Server Action: ${action}`, {
      ...context,
      action: 'server_action',
      resource: action,
    })
  }

  dbQuery(operation: string, table: string, duration: number, context: LogContext = {}): void {
    this.debug(`DB ${operation} on ${table} (${duration}ms)`, {
      ...context,
      action: 'db_query',
      resource: table,
      metadata: { operation, duration, ...context.metadata }
    })
  }

  auditEvent(event: string, resource: string, context: LogContext = {}): void {
    this.info(`Audit: ${event}`, {
      ...context,
      action: 'audit_event',
      resource,
      metadata: { event, ...context.metadata }
    })
  }
}

// Export singleton instance
export const logger = new Logger()

// Export utility functions
export function withRequestId<T>(fn: () => Promise<T>, requestId?: string): Promise<T> {
  const id = requestId || Logger.generateRequestId()
  logger.setRequestId(id)
  logger.debug('Request started', { requestId: id })
  
  return fn().finally(() => {
    logger.debug('Request completed', { requestId: id })
  })
}

// Middleware helper for API routes
export function logApiCall(method: string, path: string, handler: Function) {
  return async (...args: any[]) => {
    const requestId = Logger.generateRequestId()
    const startTime = Date.now()
    
    logger.setRequestId(requestId)
    logger.apiRequest(method, path, { requestId })

    try {
      const result = await handler(...args)
      const duration = Date.now() - startTime
      logger.apiResponse(method, path, 200, duration, { requestId })
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      logger.apiResponse(method, path, 500, duration, { 
        requestId,
        metadata: { error }
      })
      throw error
    }
  }
}
