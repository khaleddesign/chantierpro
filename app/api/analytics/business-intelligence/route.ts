import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PeriodType } from '@prisma/client';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { biEngine } from '@/lib/analytics/business-intelligence';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  type: z.enum(['performance', 'predictive', 'btp', 'report']),
  dateDebut: z.string().datetime().optional(),
  dateFin: z.string().datetime().optional(),
  periode: z.enum(['7d', '30d', '90d', '6m', '1y']).optional(),
  segmentation: z.enum(['mois', 'trimestre', 'semestre']).optional(),
  reportType: z.enum(['hebdomadaire', 'mensuel', 'trimestriel']).optional()
});

// GET /api/analytics/business-intelligence - Récupérer les analyses BI
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = await checkPermission(session.user.id, 'READ_ANALYTICS', 'analytics');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const queryParams = analyticsQuerySchema.parse({
      type: searchParams.get('type'),
      dateDebut: searchParams.get('dateDebut'),
      dateFin: searchParams.get('dateFin'),
      periode: searchParams.get('periode'),
      segmentation: searchParams.get('segmentation'),
      reportType: searchParams.get('reportType')
    });

    // Calcul des dates si période fournie
    let dateDebut: Date;
    let dateFin: Date = new Date();

    if (queryParams.dateDebut && queryParams.dateFin) {
      dateDebut = new Date(queryParams.dateDebut);
      dateFin = new Date(queryParams.dateFin);
    } else if (queryParams.periode) {
      const maintenant = new Date();
      switch (queryParams.periode) {
        case '7d':
          dateDebut = new Date(maintenant.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateDebut = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateDebut = new Date(maintenant.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6m':
          dateDebut = new Date(maintenant.getFullYear(), maintenant.getMonth() - 6, 1);
          break;
        case '1y':
          dateDebut = new Date(maintenant.getFullYear() - 1, maintenant.getMonth(), 1);
          break;
        default:
          dateDebut = new Date(maintenant.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      // Par défaut : 30 derniers jours
      dateDebut = new Date(dateFin.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let result;

    switch (queryParams.type) {
      case 'performance':
        result = await biEngine.analysePerformances(dateDebut, dateFin, queryParams.segmentation);
        break;

      case 'predictive':
        const horizonMois = queryParams.periode === '6m' ? 6 : 3;
        result = await biEngine.analysesPredictives(horizonMois);
        break;

      case 'btp':
        result = await biEngine.metriquessBTP(dateDebut, dateFin);
        break;

      case 'report':
        if (!queryParams.reportType) {
          return NextResponse.json({
            error: 'reportType requis pour le type "report"'
          }, { status: 400 });
        }
        result = await biEngine.genererRapport(queryParams.reportType, session.user.id);
        break;

      default:
        return NextResponse.json({
          error: 'Type d\'analyse non supporté'
        }, { status: 400 });
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'ACCESS_BI_ANALYTICS',
      resource: 'business_intelligence',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: {
        type: queryParams.type,
        periode: queryParams.periode || 'custom',
        dateDebut: dateDebut.toISOString(),
        dateFin: dateFin.toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        type: queryParams.type,
        periode: {
          debut: dateDebut.toISOString(),
          fin: dateFin.toISOString(),
          duree: Math.round((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24))
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur analyse BI:', error);

    // Log d'erreur de sécurité
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'BI_ANALYTICS_ERROR',
        resource: 'business_intelligence',
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

// POST /api/analytics/business-intelligence - Actions BI (snapshots, calculs, etc.)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'MANAGE_ANALYTICS', 'analytics');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, params } = body;

    let result;

    switch (action) {
      case 'calculate_snapshot':
        result = await calculateMetricSnapshot(params);
        break;

      case 'refresh_cache':
        result = await refreshAnalyticsCache();
        break;

      case 'export_report':
        result = await exportAnalyticsReport(params, session.user.id);
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: `BI_ACTION_${action.toUpperCase()}`,
      resource: 'business_intelligence',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { action, params }
    });

    return NextResponse.json({
      success: true,
      data: result,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur action BI:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

/**
 * Calcul et sauvegarde d'un snapshot de métrique
 */
async function calculateMetricSnapshot(params: {
  metric: string;
  category: string;
  period: string;
  periodType: string;
}) {
  try {
    const { metric, category, period, periodType: periodTypeStr } = params;

    // Validate and convert periodType string to PeriodType enum
    if (!Object.values(PeriodType).includes(periodTypeStr as PeriodType)) {
      throw new Error(`Invalid period type: ${periodTypeStr}`);
    }
    const periodType = periodTypeStr as PeriodType;

    // Récupérer la valeur précédente pour calcul d'évolution
    const previousSnapshot = await prisma.bIMetricSnapshot.findFirst({
      where: { metric, periodType },
      orderBy: { calculatedAt: 'desc' }
    });

    let value: number = 0;

    // Calcul de la métrique selon le type
    switch (metric) {
      case 'chiffre_affaires':
        const ca = await prisma.devis.aggregate({
          _sum: { totalTTC: true },
          where: {
            statut: { in: ['ACCEPTE', 'PAYE'] },
            dateCreation: {
              gte: new Date(period + '-01'),
              lt: new Date(new Date(period + '-01').getFullYear(), new Date(period + '-01').getMonth() + 1, 1)
            }
          }
        });
        value = ca._sum.totalTTC || 0;
        break;

      case 'marge_moyenne':
        // Calcul de la marge moyenne
        const marges = await prisma.$queryRaw`
          SELECT AVG((COALESCE(d.totalTTC, d.montant) - ch.budget) / COALESCE(d.totalTTC, d.montant) * 100) as marge
          FROM Chantier ch
          JOIN Devis d ON d.chantierId = ch.id
          WHERE d.statut IN ('ACCEPTE', 'PAYE')
            AND strftime('%Y-%m', ch.dateDebut) = ${period}
        ` as any[];
        value = marges[0]?.marge || 0;
        break;

      case 'nombre_chantiers':
        const chantiersCount = await prisma.chantier.count({
          where: {
            dateDebut: {
              gte: new Date(period + '-01'),
              lt: new Date(new Date(period + '-01').getFullYear(), new Date(period + '-01').getMonth() + 1, 1)
            }
          }
        });
        value = chantiersCount;
        break;

      default:
        throw new Error(`Métrique non supportée: ${metric}`);
    }

    // Calcul de l'évolution
    const previousValue = previousSnapshot?.value || 0;
    const change = value - previousValue;
    const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;

    // Sauvegarde du snapshot
    const snapshot = await prisma.bIMetricSnapshot.upsert({
      where: {
        metric_period_periodType: {
          metric,
          period,
          periodType
        }
      },
      create: {
        metric,
        category: category as any,
        value,
        previousValue,
        change,
        changePercent,
        period,
        periodType: periodType as any
      },
      update: {
        value,
        previousValue,
        change,
        changePercent,
        calculatedAt: new Date()
      }
    });

    return {
      snapshot,
      evolution: {
        previous: previousValue,
        current: value,
        change,
        changePercent: Math.round(changePercent * 100) / 100
      }
    };

  } catch (error) {
    console.error('Erreur calcul snapshot:', error);
    throw error;
  }
}

/**
 * Rafraîchissement du cache analytics
 */
async function refreshAnalyticsCache() {
  try {
    const maintenant = new Date();
    const unMoisAvant = new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1);

    // Recalcul des principales métriques avec cache forcé
    const results = await Promise.allSettled([
      biEngine.analysePerformances(unMoisAvant, maintenant),
      biEngine.analysesPredictives(6),
      biEngine.metriquessBTP(unMoisAvant, maintenant)
    ]);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;

    return {
      refreshed: successCount,
      errors: errorCount,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Erreur refresh cache:', error);
    throw error;
  }
}

/**
 * Export de rapport analytics
 */
async function exportAnalyticsReport(params: {
  type: string;
  format: 'json' | 'csv' | 'pdf';
  dateDebut: string;
  dateFin: string;
}, userId: string) {
  try {
    const dateDebut = new Date(params.dateDebut);
    const dateFin = new Date(params.dateFin);

    let data;

    switch (params.type) {
      case 'performance':
        data = await biEngine.analysePerformances(dateDebut, dateFin);
        break;
      case 'btp':
        data = await biEngine.metriquessBTP(dateDebut, dateFin);
        break;
      default:
        throw new Error(`Type d'export non supporté: ${params.type}`);
    }

    // Ici on pourrait intégrer avec un service d'export (PDF, Excel, etc.)
    // Pour l'instant on retourne les données JSON

    return {
      data,
      format: params.format,
      exportedAt: new Date().toISOString(),
      exportedBy: userId
    };

  } catch (error) {
    console.error('Erreur export rapport:', error);
    throw error;
  }
}