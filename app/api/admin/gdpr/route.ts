import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GDPRDataController } from '@/lib/gdpr/data-controller';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { z } from 'zod';

const gdprController = new GDPRDataController();

const processRequestSchema = z.object({
  requestId: z.string(),
  action: z.enum(['approve', 'reject']),
  note: z.string().optional()
});

const breachSchema = z.object({
  title: z.string(),
  description: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  affectedDataTypes: z.array(z.string()),
  affectedUsersCount: z.number().optional(),
  occurredAt: z.string().datetime().optional()
});

// GET /api/admin/gdpr - Récupérer les données RGPD pour les administrateurs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions administrateur
    const hasPermission = await checkPermission(session.user.id, 'MANAGE_GDPR', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let result;

    switch (action) {
      case 'pending-requests':
        result = await gdprController.getPendingDataRightsRequests();
        break;
      
      case 'all-requests':
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        result = await gdprController.getAllDataRightsRequests({ status, type });
        break;
      
      case 'consents-overview':
        result = await gdprController.getConsentsOverview();
        break;
      
      case 'processing-logs':
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        result = await gdprController.getProcessingLogs(userId, { startDate, endDate });
        break;
      
      case 'retention-report':
        result = await gdprController.getDataRetentionReport();
        break;
      
      case 'breaches':
        result = await gdprController.getDataBreaches();
        break;

      case 'compliance-report':
        result = await gdprController.generateComplianceReport();
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: `GDPR_ADMIN_VIEW_${action?.toUpperCase()}`,
      resource: 'gdpr_admin',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'MEDIUM',
      details: { action }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur RGPD Admin GET:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST /api/admin/gdpr - Actions administratives RGPD
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions administrateur
    const hasPermission = await checkPermission(session.user.id, 'MANAGE_GDPR', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'process_access_request':
        const { requestId } = processRequestSchema.parse(data);
        result = await gdprController.processAccessRequest(requestId, session.user.id);
        break;

      case 'process_erasure_request':
        const { requestId: erasureRequestId } = processRequestSchema.parse(data);
        await gdprController.processErasureRequest(erasureRequestId, session.user.id);
        result = { message: 'Demande d\'effacement traitée' };
        break;

      case 'approve_request':
        const approveData = processRequestSchema.parse(data);
        await gdprController.approveDataRightsRequest(
          approveData.requestId,
          session.user.id,
          approveData.note
        );
        result = { message: 'Demande approuvée' };
        break;

      case 'reject_request':
        const rejectData = processRequestSchema.parse(data);
        await gdprController.rejectDataRightsRequest(
          rejectData.requestId,
          session.user.id,
          rejectData.note
        );
        result = { message: 'Demande rejetée' };
        break;

      case 'report_breach':
        const breachData = breachSchema.parse(data);
        const breachId = await gdprController.reportDataBreach({
          ...breachData,
          reportedBy: session.user.id,
          affectedDataTypes: breachData.affectedDataTypes,
          occurredAt: breachData.occurredAt ? new Date(breachData.occurredAt) : undefined
        });
        result = { breachId, message: 'Violation signalée' };
        break;

      case 'cleanup_expired_data':
        const cleanupResult = await gdprController.cleanupExpiredData();
        result = { 
          message: 'Nettoyage terminé',
          deletedRecords: cleanupResult.deletedRecords,
          processedTables: cleanupResult.processedTables
        };
        break;

      case 'anonymize_user_data':
        const { userId } = z.object({ userId: z.string() }).parse(data);
        await gdprController.anonymizeUserData(userId);
        result = { message: 'Données utilisateur anonymisées' };
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    // Log de sécurité critique pour les actions administratives
    await logSecurityEvent({
      userId: session.user.id,
      action: `GDPR_ADMIN_ACTION_${action.toUpperCase()}`,
      resource: 'gdpr_admin',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'HIGH',
      details: { action, ...data }
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur RGPD Admin POST:', error);

    // Log d'erreur de sécurité
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'GDPR_ADMIN_ERROR',
        resource: 'gdpr_admin',
        ipAddress: request.ip || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'CRITICAL',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// PUT /api/admin/gdpr - Mettre à jour la configuration RGPD
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions administrateur
    const hasPermission = await checkPermission(session.user.id, 'MANAGE_GDPR', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    let result;

    switch (action) {
      case 'update_retention_policy':
        const { dataType, category, retentionDays, lawfulBasis } = z.object({
          dataType: z.string(),
          category: z.string(),
          retentionDays: z.number(),
          lawfulBasis: z.enum(['CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS'])
        }).parse(data);
        
        await gdprController.updateRetentionPolicy(dataType, category, {
          retentionDays,
          lawfulBasis
        });
        result = { message: 'Politique de conservation mise à jour' };
        break;

      case 'update_breach_status':
        const { breachId, status, notes } = z.object({
          breachId: z.string(),
          status: z.enum(['DETECTED', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'REPORTED', 'CLOSED']),
          notes: z.string().optional()
        }).parse(data);
        
        await gdprController.updateBreachStatus(breachId, status, notes);
        result = { message: 'Statut de violation mis à jour' };
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: `GDPR_ADMIN_UPDATE_${action.toUpperCase()}`,
      resource: 'gdpr_admin',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'HIGH',
      details: { action, ...data }
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur RGPD Admin PUT:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Données invalides',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}