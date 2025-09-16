import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { z } from 'zod';

const performanceQuerySchema = z.object({
  timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
  endpoint: z.string().optional(),
  minDuration: z.coerce.number().optional(),
  maxDuration: z.coerce.number().optional(),
  statusCode: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100)
});

// GET /api/admin/performance - Récupérer les métriques de performance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = await checkPermission(session.user.id, 'READ_PERFORMANCE_METRICS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    // Validation des paramètres de requête
    const { searchParams } = new URL(request.url);
    const params = performanceQuerySchema.parse({
      timeframe: searchParams.get('timeframe'),
      endpoint: searchParams.get('endpoint'),
      minDuration: searchParams.get('minDuration'),
      maxDuration: searchParams.get('maxDuration'),
      statusCode: searchParams.get('statusCode'),
      limit: searchParams.get('limit')
    });

    // Calcul de la fenêtre temporelle
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const timeWindow = new Date(Date.now() - timeframes[params.timeframe]);

    // Construction des filtres
    const where: Record<string, unknown> = {
      timestamp: { gte: timeWindow }
    };

    if (params.endpoint) {
      where.endpoint = { contains: params.endpoint };
    }

    if (params.minDuration) {
      where.duration = { ...where.duration, gte: params.minDuration };
    }

    if (params.maxDuration) {
      where.duration = { ...where.duration, lte: params.maxDuration };
    }

    if (params.statusCode) {
      where.statusCode = params.statusCode;
    }

    // Récupération des métriques détaillées
    const [metrics, stats] = await Promise.all([
      prisma.performanceMetric.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: params.limit,
        include: {
          user: {
            select: { email: true, role: true }
          }
        }
      }),

      // Statistiques agrégées
      prisma.performanceMetric.groupBy({
        by: ['endpoint', 'statusCode'],
        where,
        _avg: { duration: true },
        _min: { duration: true },
        _max: { duration: true },
        _count: { _all: true },
        orderBy: { _avg: { duration: 'desc' } }
      })
    ]);

    // Calcul des percentiles et statistiques globales
    const allDurations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const globalStats = {
      total: metrics.length,
      avgDuration: allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length || 0,
      p50: allDurations[Math.floor(allDurations.length * 0.5)] || 0,
      p95: allDurations[Math.floor(allDurations.length * 0.95)] || 0,
      p99: allDurations[Math.floor(allDurations.length * 0.99)] || 0,
      minDuration: Math.min(...allDurations) || 0,
      maxDuration: Math.max(...allDurations) || 0
    };

    // Répartition par code de statut
    const statusCodeStats = metrics.reduce((acc, metric) => {
      acc[metric.statusCode] = (acc[metric.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Top des endpoints les plus lents
    const slowestEndpoints = stats
      .map(stat => ({
        endpoint: stat.endpoint,
        avgDuration: stat._avg.duration || 0,
        minDuration: stat._min.duration || 0,
        maxDuration: stat._max.duration || 0,
        requestCount: stat._count._all,
        statusCode: stat.statusCode
      }))
      .slice(0, 10);

    // Log de sécurité pour l'accès aux métriques
    await logSecurityEvent({
      userId: session.user.id,
      action: 'VIEW_PERFORMANCE_METRICS',
      resource: 'performance_metrics',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { 
        timeframe: params.timeframe,
        metricsCount: metrics.length,
        endpoint: params.endpoint
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        stats: {
          global: globalStats,
          byStatusCode: statusCodeStats,
          slowestEndpoints,
          timeframe: params.timeframe,
          timeWindow: timeWindow.toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération métriques performance:', error);

    // Log d'erreur de sécurité
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'VIEW_PERFORMANCE_METRICS_ERROR',
        resource: 'performance_metrics',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'MEDIUM',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Paramètres invalides',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST /api/admin/performance - Enregistrer une métrique de performance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    const body = await request.json();
    const metricData = z.object({
      endpoint: z.string(),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
      duration: z.number().positive(),
      statusCode: z.number().min(100).max(599),
      memoryUsage: z.number().optional(),
      dbQueries: z.number().optional(),
      cacheHits: z.number().optional(),
      cacheMisses: z.number().optional()
    }).parse(body);

    // Enregistrement de la métrique
    const metric = await prisma.performanceMetric.create({
      data: {
        endpoint: metricData.endpoint,
        method: metricData.method,
        duration: metricData.duration,
        statusCode: metricData.statusCode,
        userId: session?.user?.id,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        memoryUsage: metricData.memoryUsage,
        dbQueries: metricData.dbQueries,
        cacheHits: metricData.cacheHits,
        cacheMisses: metricData.cacheMisses,
        timestamp: new Date()
      }
    });

    // Détection automatique des performances dégradées
    if (metricData.duration > 5000) { // Plus de 5 secondes
      await logSecurityEvent({
        userId: session?.user?.id,
        action: 'SLOW_PERFORMANCE_DETECTED',
        resource: metricData.endpoint,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'MEDIUM',
        details: {
          duration: metricData.duration,
          endpoint: metricData.endpoint,
          method: metricData.method
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: metric
    });

  } catch (error) {
    console.error('Erreur enregistrement métrique performance:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.issues
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}