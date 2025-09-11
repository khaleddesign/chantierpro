import pino from 'pino'

const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export { logger }

export const createRequestLogger = (method: string, url: string) => {
  const requestId = Math.random().toString(36).substring(7)
  const startTime = Date.now()
  
  return {
    requestId,
    info: (message: string, meta?: object) => {
      logger.info({
        requestId,
        method,
        url,
        duration: Date.now() - startTime,
        ...meta
      }, message)
    },
    error: (message: string, error?: Error, meta?: object) => {
      logger.error({
        requestId,
        method,
        url,
        duration: Date.now() - startTime,
        error: error?.message,
        stack: error?.stack,
        ...meta
      }, message)
    },
    warn: (message: string, meta?: object) => {
      logger.warn({
        requestId,
        method,
        url,
        duration: Date.now() - startTime,
        ...meta
      }, message)
    }
  }
}

export const logDatabaseOperation = (operation: string, table: string, data?: object) => {
  logger.debug({
    operation,
    table,
    data: process.env.NODE_ENV === 'development' ? data : undefined
  }, `Database ${operation} on ${table}`)
}

export const logPerformance = (label: string, duration: number, meta?: object) => {
  logger.info({
    performance: true,
    label,
    duration,
    ...meta
  }, `Performance: ${label} took ${duration}ms`)
}

// Fonction utilitaire pour les logs d'API (compatibilité)
export const apiLogger = {
  request: (method: string, url: string, data?: any) => {
    logger.debug({ method, url, data }, 'API Request')
  },
  
  response: (status: number, data?: any) => {
    logger.debug({ status, data }, 'API Response')
  },
  
  error: (error: any, context?: string) => {
    logger.error({ error, context }, 'API Error')
  }
}

