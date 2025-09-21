import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, logSecurityEvent } from '@/lib/security';

// DELETE /api/admin/integrations/sync/[id] - Annuler une synchronisation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
      where: { id: id }
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
      where: { id: id },
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
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { syncRecordId: id }
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
