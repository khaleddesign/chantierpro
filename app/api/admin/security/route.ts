import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { cache } from '@/lib/cache';
import { z } from 'zod';

const securityQuerySchema = z.object({
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  action: z.string().optional(),
  userId: z.string().optional(),
  ipAddress: z.string().optional(),
  onlyFailures: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(1000).default(100)
});

// GET /api/admin/security - Récupérer les logs de sécurité
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions administrateur
    const hasPermission = await checkPermission(session.user.id, 'READ_SECURITY_LOGS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    // Validation des paramètres de requête
    const { searchParams } = new URL(request.url);
    const params = securityQuerySchema.parse({
      timeframe: searchParams.get('timeframe'),
      riskLevel: searchParams.get('riskLevel'),
      action: searchParams.get('action'),
      userId: searchParams.get('userId'),
      ipAddress: searchParams.get('ipAddress'),
      onlyFailures: searchParams.get('onlyFailures'),
      limit: searchParams.get('limit')
    });

    // Cache key pour les statistiques fréquemment demandées
    const cacheKey = `security_logs_${JSON.stringify(params)}`;

    // Tentative de récupération depuis le cache
    const cachedResult = await cache.get(cacheKey);
    if (cachedResult) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'VIEW_SECURITY_LOGS_CACHED',
        resource: 'security_logs',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: true,
        riskLevel: 'LOW',
        details: { params, cached: true }
      });

      return NextResponse.json(cachedResult);
    }

    // Calcul de la fenêtre temporelle
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeWindow = new Date(Date.now() - timeframes[params.timeframe]);

    // Construction des filtres
    const where: any = {
      timestamp: { gte: timeWindow }
    };

    if (params.riskLevel) {
      where.riskLevel = params.riskLevel;
    }

    if (params.action) {
      where.action = { contains: params.action };
    }

    if (params.userId) {
      where.userId = params.userId;
    }

    if (params.ipAddress) {
      where.ipAddress = { contains: params.ipAddress };
    }

    if (params.onlyFailures) {
      where.success = false;
    }

    // Récupération des logs et statistiques
    const [logs, alertsStats, riskStats, actionStats, ipStats] = await Promise.all([
      // Logs détaillés
      prisma.securityLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit,
        include: {
          user: {
            select: { 
              email: true, 
              role: true, 
              nom: true 
            }
          }
        }
      }),

      // Statistiques d'alertes par niveau de risque
      prisma.securityLog.groupBy({
        by: ['riskLevel'],
        where: {
          ...where,
          riskLevel: { in: ['HIGH', 'CRITICAL'] }
        },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } }
      }),

      // Répartition par niveau de risque
      prisma.securityLog.groupBy({
        by: ['riskLevel'],
        where,
        _count: { _all: true }
      }),

      // Top des actions suspectes
      prisma.securityLog.groupBy({
        by: ['action'],
        where: {
          ...where,
          success: false
        },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 10
      }),

      // Top des IPs suspectes
      prisma.securityLog.groupBy({
        by: ['ipAddress'],
        where: {
          ...where,
          OR: [
            { success: false },
            { riskLevel: { in: ['HIGH', 'CRITICAL'] } }
          ]
        },
        _count: { _all: true },
        orderBy: { _count: { _all: 'desc' } },
        take: 10
      })
    ]);

    // Calcul des métriques de sécurité
    const totalLogs = logs.length;
    const failedAttempts = logs.filter(log => !log.success).length;
    const criticalAlerts = logs.filter(log => log.riskLevel === 'CRITICAL').length;
    const highRiskAlerts = logs.filter(log => log.riskLevel === 'HIGH').length;

    // Détection de patterns suspects récents (dernière heure)
    const recentWindow = new Date(Date.now() - 60 * 60 * 1000);
    const recentSuspiciousActivity = await prisma.securityLog.findMany({
      where: {
        timestamp: { gte: recentWindow },
        OR: [
          { riskLevel: 'CRITICAL' },
          { riskLevel: 'HIGH' },
          { action: { contains: 'BRUTE_FORCE' } },
          { action: { contains: 'RATE_LIMIT_EXCEEDED' } }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 20
    });

    // Analyse des trends temporels (par heure)
    const hourlyTrends = await prisma.$queryRaw`
      SELECT 
        strftime('%H', timestamp) as hour,
        COUNT(*) as total,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures,
        SUM(CASE WHEN riskLevel = 'HIGH' OR riskLevel = 'CRITICAL' THEN 1 ELSE 0 END) as alerts
      FROM security_logs 
      WHERE timestamp >= ${timeWindow.toISOString()}
      GROUP BY strftime('%H', timestamp)
      ORDER BY hour
    `;

    const result = {
      success: true,
      data: {
        logs,
        summary: {
          totalLogs,
          failedAttempts,
          successRate: totalLogs > 0 ? ((totalLogs - failedAttempts) / totalLogs * 100).toFixed(2) : 0,
          criticalAlerts,
          highRiskAlerts,
          timeframe: params.timeframe,
          timeWindow: timeWindow.toISOString()
        },
        statistics: {
          byRiskLevel: riskStats.reduce((acc, stat) => {
            acc[stat.riskLevel] = stat._count._all;
            return acc;
          }, {} as Record<string, number>),
          suspiciousActions: actionStats.map(stat => ({
            action: stat.action,
            count: stat._count._all
          })),
          suspiciousIPs: ipStats.map(stat => ({
            ipAddress: stat.ipAddress,
            count: stat._count._all
          })),
          hourlyTrends
        },
        alerts: {
          recent: recentSuspiciousActivity,
          byLevel: alertsStats.reduce((acc, stat) => {
            acc[stat.riskLevel] = stat._count._all;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    };

    // Mise en cache pour 5 minutes
    await cache.set(cacheKey, result, 5 * 60 * 1000, ['security_logs', `user:${session.user.id}`]);

    // Log de l'accès aux logs de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'VIEW_SECURITY_LOGS',
      resource: 'security_logs',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { 
        params,
        logsCount: totalLogs,
        alertsCount: criticalAlerts + highRiskAlerts
      }
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Erreur récupération logs sécurité:', error);

    // Log d'erreur de sécurité
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'VIEW_SECURITY_LOGS_ERROR',
        resource: 'security_logs',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'MEDIUM',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Paramètres invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// DELETE /api/admin/security - Nettoyer les anciens logs
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions administrateur
    const hasPermission = await checkPermission(session.user.id, 'DELETE_SECURITY_LOGS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const olderThan = searchParams.get('olderThan') || '90'; // Par défaut 90 jours
    const days = parseInt(olderThan);

    if (isNaN(days) || days < 7) {
      return NextResponse.json({ 
        error: 'Paramètre invalide: minimum 7 jours' 
      }, { status: 400 });
    }

    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Suppression des logs anciens (sauf les critiques)
    const deleteResult = await prisma.securityLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        riskLevel: { notIn: ['CRITICAL', 'HIGH'] } // Conserver les alertes importantes
      }
    });

    // Log de l'opération de nettoyage
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CLEANUP_SECURITY_LOGS',
      resource: 'security_logs',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'MEDIUM',
      details: {
        deletedCount: deleteResult.count,
        olderThanDays: days,
        cutoffDate: cutoffDate.toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: deleteResult.count,
        cutoffDate: cutoffDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur nettoyage logs sécurité:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}