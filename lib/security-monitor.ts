import { NextRequest } from 'next/server';
import { secureLogger } from './secure-logger';

// Types d'événements de sécurité à surveiller
export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  SUSPICIOUS_IP = 'suspicious_ip',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  SENSITIVE_DATA_ACCESS = 'sensitive_data_access',
  ADMIN_ACTION = 'admin_action',
  FILE_UPLOAD_ANOMALY = 'file_upload_anomaly',
  DATABASE_ERROR_SPIKE = 'database_error_spike',
  UNUSUAL_USER_BEHAVIOR = 'unusual_user_behavior'
}

interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

class SecurityMonitor {
  private static instance: SecurityMonitor;
  private eventBuffer: SecurityEvent[] = [];
  private suspiciousIPs = new Map<string, { count: number; lastSeen: Date; events: SecurityEventType[] }>();
  private userBehaviorTracking = new Map<string, { 
    loginAttempts: number; 
    lastLogin: Date; 
    suspiciousActions: number;
    recentEndpoints: string[];
  }>();
  
  // Seuils de détection d'anomalies
  private readonly thresholds = {
    failedLoginsPerIP: 10,
    failedLoginsPerUser: 5,
    suspiciousActionsPerUser: 20,
    databaseErrorsPerMinute: 50,
    uploadAnomaliesPerHour: 10
  };
  
  private constructor() {
    // Nettoyage périodique des données anciennes
    setInterval(() => this.cleanupOldData(), 15 * 60 * 1000); // 15 minutes
    
    // Analyse périodique des patterns suspects
    setInterval(() => this.analyzeSecurityPatterns(), 5 * 60 * 1000); // 5 minutes
  }
  
  static getInstance(): SecurityMonitor {
    if (!SecurityMonitor.instance) {
      SecurityMonitor.instance = new SecurityMonitor();
    }
    return SecurityMonitor.instance;
  }
  
  // Enregistrer un événement de sécurité
  logSecurityEvent(
    type: SecurityEventType,
    severity: SecurityEvent['severity'],
    description: string,
    request?: NextRequest,
    userId?: string,
    metadata?: Record<string, any>
  ) {
    const forwarded = request?.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request?.headers.get('x-real-ip') || 
               'unknown';
    
    const event: SecurityEvent = {
      type,
      severity,
      description,
      userId,
      ip,
      userAgent: request?.headers.get('user-agent') || undefined,
      endpoint: request?.url,
      metadata,
      timestamp: new Date()
    };
    
    this.eventBuffer.push(event);
    
    // Log via le système de logging sécurisé
    secureLogger.security(
      `Security event: ${type} - ${description}`,
      {
        eventType: type,
        severity,
        ...metadata
      },
      request,
      userId
    );
    
    // Analyser immédiatement pour les événements critiques
    if (severity === 'critical' || severity === 'high') {
      this.handleCriticalEvent(event);
    }
    
    // Mettre à jour les compteurs de surveillance
    this.updateSurveillanceCounters(event);
  }
  
  // Surveiller les tentatives de connexion échouées
  monitorFailedLogin(ip: string, userId?: string, request?: NextRequest) {
    this.logSecurityEvent(
      SecurityEventType.FAILED_LOGIN,
      'medium',
      `Failed login attempt from ${ip}${userId ? ` for user ${userId}` : ''}`,
      request,
      userId,
      { ip, userId }
    );
    
    // Mettre à jour le tracking IP
    const ipData = this.suspiciousIPs.get(ip) || { count: 0, lastSeen: new Date(), events: [] };
    ipData.count++;
    ipData.lastSeen = new Date();
    ipData.events.push(SecurityEventType.FAILED_LOGIN);
    this.suspiciousIPs.set(ip, ipData);
    
    // Vérifier si l'IP dépasse le seuil
    if (ipData.count >= this.thresholds.failedLoginsPerIP) {
      this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_IP,
        'critical',
        `IP ${ip} exceeded failed login threshold (${ipData.count} attempts)`,
        request,
        undefined,
        { ip, attemptCount: ipData.count, timeSpan: '24h' }
      );
    }
    
    // Mettre à jour le tracking utilisateur si disponible
    if (userId) {
      const userData = this.userBehaviorTracking.get(userId) || {
        loginAttempts: 0,
        lastLogin: new Date(),
        suspiciousActions: 0,
        recentEndpoints: []
      };
      userData.loginAttempts++;
      this.userBehaviorTracking.set(userId, userData);
      
      if (userData.loginAttempts >= this.thresholds.failedLoginsPerUser) {
        this.logSecurityEvent(
          SecurityEventType.UNUSUAL_USER_BEHAVIOR,
          'high',
          `User ${userId} exceeded failed login threshold`,
          request,
          userId,
          { attemptCount: userData.loginAttempts }
        );
      }
    }
  }
  
  // Surveiller les accès non autorisés
  monitorUnauthorizedAccess(endpoint: string, userId?: string, request?: NextRequest) {
    this.logSecurityEvent(
      SecurityEventType.UNAUTHORIZED_ACCESS,
      'high',
      `Unauthorized access attempt to ${endpoint}`,
      request,
      userId,
      { endpoint, method: request?.method }
    );
  }
  
  // Surveiller les accès aux données sensibles
  monitorSensitiveDataAccess(dataType: string, userId: string, request?: NextRequest) {
    this.logSecurityEvent(
      SecurityEventType.SENSITIVE_DATA_ACCESS,
      'medium',
      `Access to sensitive data: ${dataType}`,
      request,
      userId,
      { dataType, endpoint: request?.url }
    );
  }
  
  // Surveiller les actions administrateur
  monitorAdminAction(action: string, userId: string, request?: NextRequest, targetResource?: string) {
    this.logSecurityEvent(
      SecurityEventType.ADMIN_ACTION,
      'medium',
      `Admin action: ${action}${targetResource ? ` on ${targetResource}` : ''}`,
      request,
      userId,
      { action, targetResource }
    );
  }
  
  // Surveiller les anomalies d'upload de fichiers
  monitorFileUploadAnomaly(reason: string, userId?: string, request?: NextRequest, fileInfo?: any) {
    this.logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_ANOMALY,
      'medium',
      `File upload anomaly: ${reason}`,
      request,
      userId,
      { reason, fileInfo }
    );
  }
  
  // Surveiller les erreurs de base de données en pic
  monitorDatabaseErrorSpike(errorCount: number, timeWindow: string) {
    if (errorCount >= this.thresholds.databaseErrorsPerMinute) {
      this.logSecurityEvent(
        SecurityEventType.DATABASE_ERROR_SPIKE,
        'high',
        `Database error spike: ${errorCount} errors in ${timeWindow}`,
        undefined,
        undefined,
        { errorCount, timeWindow }
      );
    }
  }
  
  // Gestionnaire d'événements critiques
  private handleCriticalEvent(event: SecurityEvent) {
    // En production, déclencher des alertes immédiates
    console.error('[CRITICAL SECURITY ALERT]', {
      type: event.type,
      description: event.description,
      severity: event.severity,
      ip: event.ip,
      userId: event.userId,
      timestamp: event.timestamp.toISOString()
    });
    
    // Actions automatiques selon le type d'événement
    switch (event.type) {
      case SecurityEventType.SUSPICIOUS_IP:
        // En production, ajouter l'IP à une liste de blocage temporaire
        this.handleSuspiciousIP(event.ip!);
        break;
        
      case SecurityEventType.UNUSUAL_USER_BEHAVIOR:
        // En production, suspendre temporairement le compte utilisateur
        this.handleSuspiciousUser(event.userId!);
        break;
    }
  }
  
  // Gérer une IP suspecte
  private handleSuspiciousIP(ip: string) {
    secureLogger.security(
      `Automatic action: IP ${ip} flagged for monitoring`,
      { 
        action: 'ip_flagged',
        ip: ip.substring(0, 8) + '***', // Masquer partiellement l'IP dans les logs
        autoAction: true
      }
    );
  }
  
  // Gérer un utilisateur suspect
  private handleSuspiciousUser(userId: string) {
    secureLogger.security(
      `Automatic action: User ${userId} flagged for review`,
      { 
        action: 'user_flagged',
        userId,
        autoAction: true
      }
    );
  }
  
  // Mettre à jour les compteurs de surveillance
  private updateSurveillanceCounters(event: SecurityEvent) {
    // Tracking par utilisateur
    if (event.userId) {
      const userData = this.userBehaviorTracking.get(event.userId) || {
        loginAttempts: 0,
        lastLogin: new Date(),
        suspiciousActions: 0,
        recentEndpoints: []
      };
      
      userData.suspiciousActions++;
      if (event.endpoint) {
        userData.recentEndpoints.push(event.endpoint);
        userData.recentEndpoints = userData.recentEndpoints.slice(-20); // Garder les 20 derniers
      }
      
      this.userBehaviorTracking.set(event.userId, userData);
    }
  }
  
  // Analyser les patterns de sécurité
  private analyzeSecurityPatterns() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Analyser les événements récents
    const recentEvents = this.eventBuffer.filter(event => event.timestamp > oneHourAgo);
    
    // Détecter les patterns d'attaque coordonnée
    this.detectCoordinatedAttacks(recentEvents);
    
    // Détecter les comportements utilisateur anormaux
    this.detectAbnormalUserBehavior();
    
    // Détecter les pics d'erreur
    this.detectErrorSpikes(recentEvents);
  }
  
  // Détecter les attaques coordonnées
  private detectCoordinatedAttacks(recentEvents: SecurityEvent[]) {
    const ipGroups = new Map<string, SecurityEvent[]>();
    
    recentEvents.forEach(event => {
      if (event.ip) {
        if (!ipGroups.has(event.ip)) {
          ipGroups.set(event.ip, []);
        }
        ipGroups.get(event.ip)!.push(event);
      }
    });
    
    // Identifier les IPs avec beaucoup d'activité suspecte
    for (const [ip, events] of ipGroups.entries()) {
      if (events.length > 20 && events.some(e => e.severity === 'high' || e.severity === 'critical')) {
        this.logSecurityEvent(
          SecurityEventType.SUSPICIOUS_IP,
          'critical',
          `Coordinated attack detected from IP ${ip}`,
          undefined,
          undefined,
          { 
            ip, 
            eventCount: events.length,
            eventTypes: [...new Set(events.map(e => e.type))]
          }
        );
      }
    }
  }
  
  // Détecter les comportements utilisateur anormaux
  private detectAbnormalUserBehavior() {
    for (const [userId, behavior] of this.userBehaviorTracking.entries()) {
      if (behavior.suspiciousActions > this.thresholds.suspiciousActionsPerUser) {
        this.logSecurityEvent(
          SecurityEventType.UNUSUAL_USER_BEHAVIOR,
          'high',
          `Abnormal behavior pattern detected for user ${userId}`,
          undefined,
          userId,
          {
            suspiciousActions: behavior.suspiciousActions,
            recentEndpointsCount: behavior.recentEndpoints.length,
            uniqueEndpoints: new Set(behavior.recentEndpoints).size
          }
        );
      }
    }
  }
  
  // Détecter les pics d'erreur
  private detectErrorSpikes(recentEvents: SecurityEvent[]) {
    const errorEvents = recentEvents.filter(event => 
      event.type === SecurityEventType.DATABASE_ERROR_SPIKE ||
      event.severity === 'critical'
    );
    
    if (errorEvents.length > 10) {
      this.logSecurityEvent(
        SecurityEventType.DATABASE_ERROR_SPIKE,
        'critical',
        `System error spike detected: ${errorEvents.length} critical events in the last hour`,
        undefined,
        undefined,
        {
          errorCount: errorEvents.length,
          timeWindow: '1 hour',
          errorTypes: [...new Set(errorEvents.map(e => e.type))]
        }
      );
    }
  }
  
  // Nettoyer les données anciennes
  private cleanupOldData() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Nettoyer le buffer d'événements
    this.eventBuffer = this.eventBuffer.filter(event => event.timestamp > oneDayAgo);
    
    // Nettoyer les IPs suspectes anciennes
    for (const [ip, data] of this.suspiciousIPs.entries()) {
      if (data.lastSeen < oneDayAgo) {
        this.suspiciousIPs.delete(ip);
      }
    }
    
    // Réinitialiser les compteurs de comportement utilisateur quotidiennement
    for (const [userId, behavior] of this.userBehaviorTracking.entries()) {
      if (behavior.lastLogin < oneDayAgo) {
        behavior.loginAttempts = 0;
        behavior.suspiciousActions = Math.floor(behavior.suspiciousActions * 0.5); // Decay
        behavior.recentEndpoints = [];
        this.userBehaviorTracking.set(userId, behavior);
      }
    }
  }
  
  // Obtenir les statistiques de surveillance
  getMonitoringStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentEvents = this.eventBuffer.filter(event => event.timestamp > oneHourAgo);
    
    return {
      totalEvents: this.eventBuffer.length,
      recentEvents: recentEvents.length,
      suspiciousIPs: this.suspiciousIPs.size,
      trackedUsers: this.userBehaviorTracking.size,
      eventsByType: Object.fromEntries(
        Object.values(SecurityEventType).map(type => [
          type,
          recentEvents.filter(e => e.type === type).length
        ])
      ),
      eventsBySeverity: {
        critical: recentEvents.filter(e => e.severity === 'critical').length,
        high: recentEvents.filter(e => e.severity === 'high').length,
        medium: recentEvents.filter(e => e.severity === 'medium').length,
        low: recentEvents.filter(e => e.severity === 'low').length
      },
      lastCleanup: now.toISOString()
    };
  }
}

// Export de l'instance singleton
export const securityMonitor = SecurityMonitor.getInstance();