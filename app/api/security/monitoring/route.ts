import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-helpers';
import { secureLogger } from '@/lib/secure-logger';
import { getRateLimitStats } from '@/lib/rate-limiter';
import { withRateLimit } from '@/lib/rate-limiter';

async function getSecurityStatsHandler(request: NextRequest) {
  // SÉCURITÉ CRITIQUE: Seuls les administrateurs peuvent voir le monitoring
  const session = await requireAuth(['ADMIN']);
  
  try {
    const securityStats = secureLogger.getSecurityStats();
    const rateLimitStats = await getRateLimitStats();
    
    const monitoringData = {
      timestamp: new Date().toISOString(),
      security: {
        totalEvents: securityStats.totalEvents,
        eventsByLevel: securityStats.byLevel,
        recentCriticalEvents: securityStats.recentCritical.map(event => ({
          level: event.level,
          message: event.message,
          timestamp: event.context.timestamp,
          userId: event.context.userId,
          ip: event.context.ip?.substring(0, 8) + '***', // Masquer une partie de l'IP
          endpoint: event.context.endpoint
        }))
      },
      rateLimit: {
        totalActiveKeys: rateLimitStats.totalKeys,
        typeBreakdown: rateLimitStats.typeBreakdown,
        topActiveIPs: rateLimitStats.topIdentifiers.slice(0, 5).map(item => ({
          identifier: item.identifier.substring(0, 10) + '***', // Masquer l'identifiant complet
          requests: item.requests
        }))
      },
      alerts: await generateSecurityAlerts(),
      recommendations: generateSecurityRecommendations(securityStats, rateLimitStats)
    };
    
    // Log l'accès aux données de monitoring
    secureLogger.audit(
      'Security monitoring data accessed',
      { 
        dataTypes: ['security_stats', 'rate_limit_stats'],
        accessedBy: session.user.id 
      },
      request,
      session.user.id
    );
    
    return NextResponse.json({
      success: true,
      data: monitoringData
    });
    
  } catch (error) {
    secureLogger.error(
      'Failed to retrieve security monitoring data',
      error instanceof Error ? error : new Error(String(error)),
      { operation: 'get_security_stats' },
      request,
      session.user.id
    );
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des données de monitoring' },
      { status: 500 }
    );
  }
}

// Génération d'alertes de sécurité basées sur les patterns détectés
async function generateSecurityAlerts(): Promise<Array<{
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  timestamp: string;
  actionRequired: string;
}>> {
  const alerts = [];
  const securityStats = secureLogger.getSecurityStats();
  const rateLimitStats = getRateLimitStats();
  
  // Alerte pour trop d'événements de sécurité critiques
  const criticalEvents = securityStats.byLevel['security'] || 0;
  if (criticalEvents > 10) {
    alerts.push({
      severity: 'critical' as const,
      type: 'HIGH_SECURITY_EVENTS',
      message: `${criticalEvents} événements de sécurité critiques détectés`,
      timestamp: new Date().toISOString(),
      actionRequired: 'Examiner immédiatement les logs de sécurité et identifier les causes'
    });
  }
  
  // Alerte pour activité de rate limiting élevée
  const authRateLimit = (await rateLimitStats).typeBreakdown['AUTH'] || 0;
  if (authRateLimit > 50) {
    alerts.push({
      severity: 'high' as const,
      type: 'HIGH_AUTH_RATE_LIMIT',
      message: `${authRateLimit} tentatives d'authentification bloquées par rate limiting`,
      timestamp: new Date().toISOString(),
      actionRequired: 'Vérifier les tentatives de brute force et considérer un blocage IP'
    });
  }
  
  // Alerte pour beaucoup d'erreurs
  const errorEvents = securityStats.byLevel['error'] || 0;
  if (errorEvents > 100) {
    alerts.push({
      severity: 'medium' as const,
      type: 'HIGH_ERROR_RATE',
      message: `${errorEvents} erreurs système détectées`,
      timestamp: new Date().toISOString(),
      actionRequired: 'Examiner les logs d\'erreur et identifier les problèmes récurrents'
    });
  }
  
  return alerts;
}

// Génération de recommandations de sécurité
function generateSecurityRecommendations(securityStats: any, rateLimitStats: any): Array<{
  priority: 'high' | 'medium' | 'low';
  category: string;
  recommendation: string;
  impact: string;
}> {
  const recommendations = [];
  
  // Recommandation basée sur l'activité de rate limiting
  if (rateLimitStats.totalKeys > 1000) {
    recommendations.push({
      priority: 'medium' as const,
      category: 'Performance',
      recommendation: 'Considérer l\'implémentation de Redis pour le rate limiting en raison du volume élevé de requêtes',
      impact: 'Amélioration des performances et réduction de la consommation mémoire'
    });
  }
  
  // Recommandation basée sur les événements de sécurité
  if (securityStats.totalEvents > 500) {
    recommendations.push({
      priority: 'high' as const,
      category: 'Monitoring',
      recommendation: 'Configurer un système de monitoring externe (DataDog, New Relic) pour l\'analyse des logs',
      impact: 'Meilleure visibilité sur les incidents de sécurité et réaction plus rapide'
    });
  }
  
  // Recommandation générale
  recommendations.push({
    priority: 'medium' as const,
    category: 'Sécurité',
    recommendation: 'Planifier des audits de sécurité réguliers et des tests de pénétration',
    impact: 'Identification proactive des vulnérabilités avant qu\'elles ne soient exploitées'
  });
  
  return recommendations;
}

// Configuration d'alertes en temps réel
async function configureAlertsHandler(request: NextRequest) {
  const session = await requireAuth(['ADMIN']);
  
  try {
    const { alertTypes, thresholds, notifications } = await request.json();
    
    // En production, ceci sauvegarderait la configuration dans la base de données
    const alertConfig = {
      alertTypes: alertTypes || ['security_events', 'rate_limit_exceeded', 'error_spikes'],
      thresholds: {
        criticalEvents: thresholds?.criticalEvents || 5,
        rateLimitViolations: thresholds?.rateLimitViolations || 20,
        errorRate: thresholds?.errorRate || 50,
        ...thresholds
      },
      notifications: {
        email: notifications?.email || false,
        slack: notifications?.slack || false,
        webhook: notifications?.webhook || null,
        ...notifications
      },
      updatedAt: new Date().toISOString(),
      updatedBy: session.user.id
    };
    
    secureLogger.audit(
      'Security alert configuration updated',
      { 
        alertConfig,
        previousConfig: 'stored_separately' // En production, récupérer l'ancienne config
      },
      request,
      session.user.id
    );
    
    return NextResponse.json({
      success: true,
      message: 'Configuration des alertes mise à jour',
      data: alertConfig
    });
    
  } catch (error) {
    secureLogger.error(
      'Failed to update alert configuration',
      error instanceof Error ? error : new Error(String(error)),
      { operation: 'configure_alerts' },
      request,
      session.user.id
    );
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la configuration' },
      { status: 500 }
    );
  }
}

// Endpoints avec rate limiting appliqué
export const GET = withRateLimit(getSecurityStatsHandler, 'API_READ');
export const POST = withRateLimit(configureAlertsHandler, 'API_WRITE');