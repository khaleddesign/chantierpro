import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { integrationManager } from '@/lib/integrations/base';
import { z } from 'zod';

const syncRequestSchema = z.object({
  integrationId: z.string().cuid(),
  syncType: z.enum(['CLIENTS', 'FACTURES', 'CHANTIERS', 'CONTACTS', 'DOCUMENTS', 'FULL', 'PARTIAL']),
  direction: z.enum(['IMPORT', 'EXPORT', 'BIDIRECTIONAL']),
  options: z.record(z.any()).optional()
});

// GET /api/admin/integrations/sync - Récupérer l'historique des synchronisations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'READ_INTEGRATIONS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integrationId');
    const syncType = searchParams.get('syncType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Construction des filtres
    const where: any = {};
    if (integrationId) where.integrationId = integrationId;
    if (syncType) where.syncType = syncType;
    if (status) where.status = status;

    // Récupération des enregistrements de sync
    const [syncRecords, totalCount] = await Promise.all([
      prisma.syncRecord.findMany({
        where,
        include: {
          integration: {
            select: { name: true, type: true, provider: true }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: limit
      }),

      prisma.syncRecord.count({ where })
    ]);

    // Statistiques globales
    const stats = await prisma.syncRecord.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: {
        startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // 7 derniers jours
      }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count._all;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        syncRecords,
        pagination: {
          total: totalCount,
          limit,
          hasMore: totalCount > limit
        },
        stats: {
          byStatus: statusStats,
          totalThisWeek: stats.reduce((sum, stat) => sum + stat._count._all, 0)
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération historique sync:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST /api/admin/integrations/sync - Lancer une synchronisation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'MANAGE_INTEGRATIONS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const body = await request.json();
    const { integrationId, syncType, direction, options } = syncRequestSchema.parse(body);

    // Vérifier que l'intégration existe et est active
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      return NextResponse.json({
        error: 'Intégration non trouvée'
      }, { status: 404 });
    }

    if (!integration.enabled || integration.status !== 'ACTIVE') {
      return NextResponse.json({
        error: 'Intégration non active'
      }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà une sync en cours pour cette intégration
    const runningSyncs = await prisma.syncRecord.findMany({
      where: {
        integrationId,
        status: { in: ['PENDING', 'RUNNING'] }
      }
    });

    if (runningSyncs.length > 0) {
      return NextResponse.json({
        error: 'Une synchronisation est déjà en cours pour cette intégration'
      }, { status: 409 });
    }

    // Créer l'enregistrement de synchronisation
    const syncRecord = await prisma.syncRecord.create({
      data: {
        integrationId,
        syncType,
        direction,
        status: 'PENDING',
        details: options as any
      }
    });

    // Lancer la synchronisation en arrière-plan
    processSyncInBackground(syncRecord.id, session.user.id);

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'START_INTEGRATION_SYNC',
      resource: 'integrations',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'MEDIUM',
      details: {
        integrationId,
        syncType,
        direction,
        syncRecordId: syncRecord.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        syncRecord,
        message: 'Synchronisation lancée avec succès'
      }
    }, { status: 202 });

  } catch (error) {
    console.error('Erreur lancement synchronisation:', error);

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

// DELETE /api/admin/integrations/sync/[id] - Annuler une synchronisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const hasPermission = await checkPermission(session.user.id, 'MANAGE_INTEGRATIONS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    // Vérifier que la sync existe et peut être annulée
    const syncRecord = await prisma.syncRecord.findUnique({
      where: { id: params.id }
    });

    if (!syncRecord) {
      return NextResponse.json({
        error: 'Synchronisation non trouvée'
      }, { status: 404 });
    }

    if (!['PENDING', 'RUNNING'].includes(syncRecord.status)) {
      return NextResponse.json({
        error: 'Cette synchronisation ne peut pas être annulée'
      }, { status: 400 });
    }

    // Marquer comme annulée
    await prisma.syncRecord.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        completedAt: new Date(),
        errorMessage: 'Annulé par l\'utilisateur'
      }
    });

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CANCEL_INTEGRATION_SYNC',
      resource: 'integrations',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { syncRecordId: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Synchronisation annulée'
    });

  } catch (error) {
    console.error('Erreur annulation synchronisation:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

/**
 * Fonction pour traiter la synchronisation en arrière-plan
 */
async function processSyncInBackground(syncRecordId: string, userId: string): Promise<void> {
  try {
    // Récupérer les détails de la synchronisation
    const syncRecord = await prisma.syncRecord.findUnique({
      where: { id: syncRecordId },
      include: { integration: true }
    });

    if (!syncRecord || !syncRecord.integration) {
      throw new Error('Sync record ou intégration non trouvé');
    }

    // Marquer comme en cours
    await prisma.syncRecord.update({
      where: { id: syncRecordId },
      data: { status: 'RUNNING' }
    });

    // Récupérer l'instance d'intégration
    const integrationInstance = integrationManager.get(syncRecord.integrationId);
    if (!integrationInstance) {
      throw new Error('Instance d\'intégration non trouvée dans le manager');
    }

    let result;
    let totalItems = 0;
    let processedItems = 0;
    let successfulItems = 0;
    let failedItems = 0;

    // Exécuter la synchronisation selon le type
    switch (syncRecord.syncType) {
      case 'CLIENTS':
        if (syncRecord.integration.type === 'ACCOUNTING') {
          result = await (integrationInstance as any).syncClients();
          totalItems = result.data?.created + result.data?.updated || 0;
          successfulItems = totalItems;
          processedItems = totalItems;
        }
        break;

      case 'FACTURES':
        if (syncRecord.integration.type === 'ACCOUNTING') {
          result = await (integrationInstance as any).syncFactures();
          totalItems = result.data?.created + result.data?.updated || 0;
          successfulItems = totalItems;
          processedItems = totalItems;
        }
        break;

      case 'FULL':
        result = await integrationInstance.syncData(syncRecord.details as any);
        // Les détails dépendent de l'implémentation spécifique
        totalItems = 1;
        processedItems = 1;
        successfulItems = result.success ? 1 : 0;
        failedItems = result.success ? 0 : 1;
        break;

      default:
        throw new Error(`Type de synchronisation non supporté: ${syncRecord.syncType}`);
    }

    // Mise à jour avec succès
    await prisma.syncRecord.update({
      where: { id: syncRecordId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        totalItems,
        processedItems,
        successfulItems,
        failedItems,
        details: {
          ...syncRecord.details as any,
          result: result.data
        } as any
      }
    });

    // Mise à jour des métriques de l'intégration
    await prisma.integration.update({
      where: { id: syncRecord.integrationId },
      data: {
        lastSync: new Date(),
        successfulRequests: { increment: successfulItems },
        failedRequests: { increment: failedItems }
      }
    });

    // Log de sécurité
    await logSecurityEvent({
      userId,
      action: 'INTEGRATION_SYNC_COMPLETED',
      resource: 'integrations',
      ipAddress: 'system',
      userAgent: 'ChantierPro/Background',
      success: true,
      riskLevel: 'LOW',
      details: {
        syncRecordId,
        integrationId: syncRecord.integrationId,
        totalItems,
        successfulItems,
        failedItems
      }
    });

  } catch (error) {
    console.error(`Erreur traitement sync ${syncRecordId}:`, error);

    // Marquer comme échouée
    await prisma.syncRecord.update({
      where: { id: syncRecordId },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    });

    // Log de sécurité pour l'erreur
    await logSecurityEvent({
      userId,
      action: 'INTEGRATION_SYNC_FAILED',
      resource: 'integrations',
      ipAddress: 'system',
      userAgent: 'ChantierPro/Background',
      success: false,
      riskLevel: 'MEDIUM',
      details: {
        syncRecordId,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    });
  }
}