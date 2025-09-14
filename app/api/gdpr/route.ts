import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { GDPRDataController } from '@/lib/gdpr/data-controller';
import { checkPermission, logSecurityEvent } from '@/lib/security';
import { z } from 'zod';

const gdprController = new GDPRDataController();

const consentSchema = z.object({
  purpose: z.enum(['MARKETING', 'ANALYTICS', 'COMMUNICATION', 'PROFILING', 'THIRD_PARTY_SHARING', 'COOKIES', 'GEOLOCATION', 'PHOTO_STORAGE']),
  granted: z.boolean()
});

const dataRightsSchema = z.object({
  type: z.enum(['ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICT', 'PORTABILITY', 'OBJECT']),
  requestData: z.any().optional()
});

// GET /api/gdpr - Récupérer les informations RGPD de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    let result;

    switch (action) {
      case 'consents':
        result = await gdprController.getUserConsents(session.user.id);
        break;
      
      case 'processing-logs':
        result = await gdprController.getProcessingLogs(session.user.id);
        break;
      
      case 'data-rights-requests':
        result = await gdprController.getDataRightsRequests(session.user.id);
        break;
      
      case 'retention-policies':
        result = await gdprController.getRetentionPolicies();
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: `GDPR_VIEW_${action?.toUpperCase()}`,
      resource: 'gdpr',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { action }
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Erreur RGPD GET:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST /api/gdpr - Actions RGPD
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let result;

    switch (action) {
      case 'record_consent':
        const consentData = consentSchema.parse(data);
        await gdprController.recordConsent({
          userId: session.user.id,
          purpose: consentData.purpose,
          granted: consentData.granted,
          ipAddress,
          userAgent
        });
        result = { message: 'Consentement enregistré' };
        break;

      case 'withdraw_consent':
        const { purpose } = z.object({ purpose: consentSchema.shape.purpose }).parse(data);
        await gdprController.withdrawConsent(session.user.id, purpose, ipAddress, userAgent);
        result = { message: 'Consentement retiré' };
        break;

      case 'submit_data_rights_request':
        const requestData = dataRightsSchema.parse(data);
        const requestId = await gdprController.submitDataRightsRequest(
          session.user.id,
          requestData.type,
          requestData.requestData
        );
        result = { requestId, message: 'Demande soumise' };
        break;

      case 'export_my_data':
        const exportedData = await gdprController.exportUserData(session.user.id);
        result = { data: exportedData, message: 'Données exportées' };
        break;

      default:
        return NextResponse.json({
          error: 'Action non supportée'
        }, { status: 400 });
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: `GDPR_ACTION_${action.toUpperCase()}`,
      resource: 'gdpr',
      ipAddress,
      userAgent,
      success: true,
      riskLevel: 'MEDIUM',
      details: { action, ...data }
    });

    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Erreur RGPD POST:', error);

    // Log d'erreur de sécurité
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      await logSecurityEvent({
        userId: session.user.id,
        action: 'GDPR_ERROR',
        resource: 'gdpr',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        success: false,
        riskLevel: 'HIGH',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
    }

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

// DELETE /api/gdpr - Effacement complet des données (droit à l'oubli)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Cette action nécessite une confirmation explicite
    const { searchParams } = new URL(request.url);
    const confirmed = searchParams.get('confirmed');

    if (confirmed !== 'true') {
      return NextResponse.json({
        error: 'Confirmation requise pour la suppression définitive',
        confirmation_required: true
      }, { status: 400 });
    }

    // Soumission automatique d'une demande d'effacement
    const requestId = await gdprController.submitDataRightsRequest(
      session.user.id,
      'ERASURE',
      { reason: 'User requested account deletion', confirmed: true }
    );

    // Log de sécurité critique
    await logSecurityEvent({
      userId: session.user.id,
      action: 'GDPR_DELETE_REQUEST',
      resource: 'gdpr',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'CRITICAL',
      details: { requestId, confirmed: true }
    });

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Demande de suppression soumise. Elle sera traitée dans les 30 jours.'
    });

  } catch (error) {
    console.error('Erreur RGPD DELETE:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}