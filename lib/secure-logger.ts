import { NextRequest } from 'next/server';

// Types de logs de sécurité
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  SECURITY = 'security',
  AUDIT = 'audit'
}

interface LogContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  timestamp: string;
  requestId?: string;
}

interface SecurityEvent {
  level: LogLevel;
  message: string;
  context: LogContext;
  metadata?: Record<string, any>;
  stackTrace?: string;
}

// Configuration des logs sensibles à filtrer
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'credit_card',
  'ssn',
  'social_security'
];

const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /bearer/i,
  /api[_-]?key/i,
  /[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}[- ]?[0-9]{4}/, // Numéro de carte
  /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN américain
  /\b[\w.-]+@[\w.-]+\.\w+\b/, // Emails (selon le contexte)
];

class SecureLogger {
  private static instance: SecureLogger;
  private logBuffer: SecurityEvent[] = [];
  private maxBufferSize = 1000;
  
  private constructor() {
    // Vider le buffer périodiquement
    setInterval(() => this.flushLogs(), 60000); // Toutes les minutes
  }
  
  static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }
  
  // Sanitize sensitive data from objects
  private sanitizeData(data: any): any {
    if (typeof data === 'string') {
      let sanitized = data;
      
      // Masquer les patterns sensibles
      SENSITIVE_PATTERNS.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      
      return sanitized;
    }
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeData(item));
      }
      
      const sanitized: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(data)) {
        const keyLower = key.toLowerCase();
        
        // Champs sensibles complètement masqués
        if (SENSITIVE_FIELDS.some(field => keyLower.includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      
      return sanitized;
    }
    
    return data;
  }
  
  // Extraire le contexte de la requête
  private extractContext(request?: NextRequest, userId?: string): LogContext {
    const forwarded = request?.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request?.headers.get('x-real-ip') || 
               'unknown';
    
    return {
      userId,
      ip,
      userAgent: request?.headers.get('user-agent') || 'unknown',
      endpoint: request?.url,
      method: request?.method,
      timestamp: new Date().toISOString(),
      requestId: request?.headers.get('x-request-id') || Math.random().toString(36).substring(7)
    };
  }
  
  // Log sécurisé avec niveaux
  log(level: LogLevel, message: string, metadata?: Record<string, any>, request?: NextRequest, userId?: string, error?: Error) {
    const context = this.extractContext(request, userId);
    
    const logEvent: SecurityEvent = {
      level,
      message: this.sanitizeData(message) as string,
      context,
      metadata: metadata ? this.sanitizeData(metadata) : undefined,
      stackTrace: error?.stack
    };
    
    // En développement, afficher dans la console
    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === LogLevel.ERROR ? 'error' : 
                       level === LogLevel.WARN ? 'warn' : 'log';
      console[logMethod](`[${level.toUpperCase()}] ${message}`, {
        context,
        metadata: logEvent.metadata,
        stack: error?.stack
      });
    }
    
    // En production, utiliser un logging sécurisé
    if (process.env.NODE_ENV === 'production') {
      this.logBuffer.push(logEvent);
      
      // Si le buffer est plein, forcer le flush
      if (this.logBuffer.length >= this.maxBufferSize) {
        this.flushLogs();
      }
    }
    
    // Alertes critiques immédiates
    if (level === LogLevel.SECURITY || level === LogLevel.ERROR) {
      this.handleCriticalEvent(logEvent);
    }
  }
  
  // Méthodes de convenance
  info(message: string, metadata?: Record<string, any>, request?: NextRequest, userId?: string) {
    this.log(LogLevel.INFO, message, metadata, request, userId);
  }
  
  warn(message: string, metadata?: Record<string, any>, request?: NextRequest, userId?: string) {
    this.log(LogLevel.WARN, message, metadata, request, userId);
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>, request?: NextRequest, userId?: string) {
    this.log(LogLevel.ERROR, message, metadata, request, userId, error);
  }
  
  security(message: string, metadata?: Record<string, any>, request?: NextRequest, userId?: string) {
    this.log(LogLevel.SECURITY, message, metadata, request, userId);
  }
  
  audit(message: string, metadata?: Record<string, any>, request?: NextRequest, userId?: string) {
    this.log(LogLevel.AUDIT, message, metadata, request, userId);
  }
  
  // Gestion des événements critiques
  private handleCriticalEvent(event: SecurityEvent) {
    // En production, ceci devrait déclencher des alertes
    // (email, Slack, monitoring système, etc.)
    
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Envoyer vers un service de monitoring
      // await this.sendToMonitoring(event);
      
      console.error('[CRITICAL SECURITY EVENT]', {
        level: event.level,
        message: event.message,
        timestamp: event.context.timestamp,
        userId: event.context.userId,
        ip: event.context.ip,
        endpoint: event.context.endpoint
      });
    }
  }
  
  // Vider le buffer de logs
  private flushLogs() {
    if (this.logBuffer.length === 0) return;
    
    // En production, envoyer vers un service de logging centralisé
    if (process.env.NODE_ENV === 'production') {
      // Exemple: Envoyer vers ELK, Splunk, DataDog, etc.
      // await this.sendToLogService(this.logBuffer);
    }
    
    this.logBuffer = [];
  }
  
  // Obtenir des statistiques de sécurité
  getSecurityStats(): {
    totalEvents: number;
    byLevel: Record<string, number>;
    recentCritical: SecurityEvent[];
  } {
    const stats = {
      totalEvents: this.logBuffer.length,
      byLevel: {} as Record<string, number>,
      recentCritical: [] as SecurityEvent[]
    };
    
    this.logBuffer.forEach(event => {
      stats.byLevel[event.level] = (stats.byLevel[event.level] || 0) + 1;
      
      if (event.level === LogLevel.SECURITY || event.level === LogLevel.ERROR) {
        stats.recentCritical.push(event);
      }
    });
    
    // Garder seulement les 10 événements critiques les plus récents
    stats.recentCritical = stats.recentCritical
      .sort((a, b) => new Date(b.context.timestamp).getTime() - new Date(a.context.timestamp).getTime())
      .slice(0, 10);
    
    return stats;
  }
}

// Export des fonctions utilitaires
export const secureLogger = SecureLogger.getInstance();

// Helper pour créer des messages d'erreur sécurisés pour les clients
export function createSafeErrorMessage(error: any, isProduction: boolean = process.env.NODE_ENV === 'production'): string {
  if (!isProduction) {
    // En développement, afficher plus de détails
    return error instanceof Error ? error.message : String(error);
  }
  
  // En production, messages génériques
  const safeMessages: Record<string, string> = {
    'validation': 'Données fournies invalides',
    'auth': 'Échec de l\'authentification',
    'permission': 'Accès non autorisé',
    'notfound': 'Ressource non trouvée',
    'ratelimit': 'Trop de requêtes',
    'database': 'Service temporairement indisponible',
    'upload': 'Erreur lors de l\'upload du fichier',
    'default': 'Une erreur est survenue'
  };
  
  // Déterminer le type d'erreur basé sur le message
  const errorMessage = String(error).toLowerCase();
  
  if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
    return safeMessages.validation;
  }
  if (errorMessage.includes('auth') || errorMessage.includes('token') || errorMessage.includes('session')) {
    return safeMessages.auth;
  }
  if (errorMessage.includes('permission') || errorMessage.includes('access') || errorMessage.includes('forbidden')) {
    return safeMessages.permission;
  }
  if (errorMessage.includes('not found') || errorMessage.includes('404')) {
    return safeMessages.notfound;
  }
  if (errorMessage.includes('rate') || errorMessage.includes('limit')) {
    return safeMessages.ratelimit;
  }
  if (errorMessage.includes('database') || errorMessage.includes('connection') || errorMessage.includes('prisma')) {
    return safeMessages.database;
  }
  if (errorMessage.includes('upload') || errorMessage.includes('file')) {
    return safeMessages.upload;
  }
  
  return safeMessages.default;
}