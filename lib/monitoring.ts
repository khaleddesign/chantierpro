import { logger, logPerformance } from './logger'

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

export interface ErrorReport {
  message: string
  stack?: string
  url?: string
  userAgent?: string
  userId?: string
  timestamp: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

class MonitoringService {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorReport[] = []
  private maxMetrics = 1000
  private maxErrors = 100

  recordMetric(name: string, value: number, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    }

    this.metrics.push(metric)
    
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    logPerformance(name, value, tags)
  }

  recordError(error: Error | string, context?: {
    severity?: ErrorReport['severity']
    url?: string
    userId?: string
    userAgent?: string
  }) {
    const errorReport: ErrorReport = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      timestamp: Date.now(),
      severity: context?.severity || 'medium',
      url: context?.url,
      userId: context?.userId,
      userAgent: context?.userAgent
    }

    this.errors.push(errorReport)

    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    logger.error({
      error: errorReport,
      context
    }, 'Error recorded')

    if (errorReport.severity === 'critical') {
      this.alertCriticalError(errorReport)
    }
  }

  private alertCriticalError(error: ErrorReport) {
    logger.error({
      alert: true,
      critical: true,
      error
    }, 'CRITICAL ERROR DETECTED')
  }

  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name)
    }
    return [...this.metrics]
  }

  getErrors(severity?: ErrorReport['severity']): ErrorReport[] {
    if (severity) {
      return this.errors.filter(e => e.severity === severity)
    }
    return [...this.errors]
  }

  getStats() {
    return {
      totalMetrics: this.metrics.length,
      totalErrors: this.errors.length,
      errorsBySeverity: {
        low: this.errors.filter(e => e.severity === 'low').length,
        medium: this.errors.filter(e => e.severity === 'medium').length,
        high: this.errors.filter(e => e.severity === 'high').length,
        critical: this.errors.filter(e => e.severity === 'critical').length,
      },
      recentErrors: this.errors.slice(-10)
    }
  }

  clearMetrics() {
    this.metrics = []
  }

  clearErrors() {
    this.errors = []
  }
}

export const monitoring = new MonitoringService()

export const withPerformanceTracking = <T extends any[], R>(
  fn: (...args: T) => R | Promise<R>,
  metricName: string
) => {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now()
    
    try {
      const result = await fn(...args)
      const duration = performance.now() - startTime
      
      monitoring.recordMetric(metricName, duration, {
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      monitoring.recordMetric(metricName, duration, {
        status: 'error'
      })
      
      monitoring.recordError(error as Error, {
        severity: 'high'
      })
      
      throw error
    }
  }
}