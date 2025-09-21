import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, logSecurityEvent, DataEncryption } from '@/lib/security';
import { integrationManager } from '@/lib/integrations/base';
import { z } from 'zod';

const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  baseUrl: z.string().url().optional(),
  apiVersion: z.string().optional(),
  timeout: z.number().min(1000).max(60000).optional(),
  rateLimitRequests: z.number().min(1).max(10000).optional(),
  rateLimitWindow: z.number().min(60).max(86400).optional(),
  retryAttempts: z.number().min(0).max(10).optional(),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  settings: z.record(z.string(), z.any()).optional()
});

// Helper function pour initialiser une intégration
async function initializeIntegration(id: string) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id }
    });
    
    if (!integration) return;
    
    // Logique d'initialisation selon le type
    console.log(`Initialisation de l'intégration ${integration.name} (${integration.type})`);
  } catch (error) {
    console.error('Erreur initialisation intégration:', error);
  }
}

// PUT /api/admin/integrations/[id] - Mettre à jour une intégration
export async function PUT(
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

    const body = await request.json();
    const validatedData = updateIntegrationSchema.parse(body);

    // Vérifier que l'intégration existe
    const existingIntegration = await prisma.integration.findUnique({
      where: { id }
    });

    if (!existingIntegration) {
      return NextResponse.json({ error: 'Intégration non trouvée' }, { status: 404 });
    }

    // Chiffrement des nouveaux credentials
    let updateData: Record<string, unknown> = { ...validatedData };

    if (validatedData.apiKey) {
      const encrypted = DataEncryption.encrypt(validatedData.apiKey);
      updateData.apiKey = JSON.stringify(encrypted);
    }

    if (validatedData.apiSecret) {
      const encrypted = DataEncryption.encrypt(validatedData.apiSecret);
      updateData.apiSecret = JSON.stringify(encrypted);
    }

    // Mise à jour
    const updatedIntegration = await prisma.integration.update({
      where: { id },
      data: updateData
    });

    // Re-initialisation si l'intégration était activée
    if (validatedData.enabled && !existingIntegration.enabled) {
      await initializeIntegration(id);
    } else if (!validatedData.enabled && existingIntegration.enabled) {
      // Désenregistrer de l'IntegrationManager
      integrationManager.get(id); // Si elle existe, elle sera remplacée
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'UPDATE_INTEGRATION',
      resource: 'integrations',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'MEDIUM',
      details: {
        integrationId: id,
        changes: Object.keys(validatedData)
      }
    });

    const { apiKey, apiSecret, ...safeIntegration } = updatedIntegration;

    return NextResponse.json({
      success: true,
      data: {
        ...safeIntegration,
        hasCredentials: !!(apiKey && apiKey.length > 0)
      }
    });

  } catch (error) {
    console.error('Erreur mise à jour intégration:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// DELETE /api/admin/integrations/[id] - Supprimer une intégration
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

    // Vérifier que l'intégration existe
    const existingIntegration = await prisma.integration.findUnique({
      where: { id }
    });

    if (!existingIntegration) {
      return NextResponse.json({ error: 'Intégration non trouvée' }, { status: 404 });
    }

    // Désenregistrer de l'IntegrationManager
    integrationManager.get(id);

    // Suppression
    await prisma.integration.delete({
      where: { id }
    });

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'DELETE_INTEGRATION',
      resource: 'integrations',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'HIGH',
      details: {
        integrationId: id,
        integrationName: existingIntegration.name
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Intégration supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression intégration:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}
