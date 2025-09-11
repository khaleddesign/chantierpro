import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkPermission, logSecurityEvent, DataEncryption } from '@/lib/security';
import { integrationManager } from '@/lib/integrations/base';
import { ComptabiliteIntegration, ComptabiliteConfigs } from '@/lib/integrations/accounting';
import { MappingIntegration, WeatherIntegration, CommunicationIntegration, CloudStorageIntegration, ESignatureIntegration } from '@/lib/integrations/external-services';
import { z } from 'zod';

const integrationSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['ACCOUNTING', 'MAPPING', 'WEATHER', 'COMMUNICATION', 'CLOUD_STORAGE', 'E_SIGNATURE', 'PAYMENT', 'OTHER']),
  provider: z.string().min(1).max(50),
  enabled: z.boolean().default(false),
  baseUrl: z.string().url().optional(),
  apiVersion: z.string().optional(),
  timeout: z.number().min(1000).max(60000).default(10000),
  rateLimitRequests: z.number().min(1).max(10000).default(100),
  rateLimitWindow: z.number().min(60).max(86400).default(3600),
  retryAttempts: z.number().min(0).max(10).default(3),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  settings: z.record(z.any()).optional()
});

const updateIntegrationSchema = integrationSchema.partial().omit({ type: true, provider: true });

// GET /api/admin/integrations - Liste des intégrations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = await checkPermission(session.user.id, 'READ_INTEGRATIONS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const enabled = searchParams.get('enabled');
    const status = searchParams.get('status');

    // Construction des filtres
    const where: any = {};
    if (type) where.type = type;
    if (enabled !== null) where.enabled = enabled === 'true';
    if (status) where.status = status;

    // Récupération des intégrations
    const integrations = await prisma.integration.findMany({
      where,
      include: {
        logs: {
          orderBy: { timestamp: 'desc' },
          take: 5
        },
        syncRecords: {
          orderBy: { startedAt: 'desc' },
          take: 3
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Masquer les credentials sensibles
    const safeIntegrations = integrations.map(integration => {
      const { apiKey, apiSecret, ...safeIntegration } = integration;
      return {
        ...safeIntegration,
        hasCredentials: !!(apiKey && apiKey.length > 0)
      };
    });

    // Health check pour les intégrations actives
    const healthResults = await integrationManager.healthCheckAll();

    // Log de l'accès
    await logSecurityEvent({
      userId: session.user.id,
      action: 'VIEW_INTEGRATIONS',
      resource: 'integrations',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'LOW',
      details: { count: integrations.length, filters: { type, enabled, status } }
    });

    return NextResponse.json({
      success: true,
      data: {
        integrations: safeIntegrations,
        healthStatus: healthResults,
        summary: {
          total: integrations.length,
          active: integrations.filter(i => i.status === 'ACTIVE').length,
          enabled: integrations.filter(i => i.enabled).length,
          withIssues: integrations.filter(i => ['ERROR', 'DEGRADED'].includes(i.status)).length
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération intégrations:', error);
    return NextResponse.json({
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

// POST /api/admin/integrations - Créer une nouvelle intégration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérification des permissions
    const hasPermission = await checkPermission(session.user.id, 'MANAGE_INTEGRATIONS', 'admin');
    if (!hasPermission) {
      return NextResponse.json({ error: 'Permissions insuffisantes' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = integrationSchema.parse(body);

    // Vérification de l'unicité du nom
    const existingIntegration = await prisma.integration.findFirst({
      where: { name: validatedData.name }
    });

    if (existingIntegration) {
      return NextResponse.json({
        error: 'Une intégration avec ce nom existe déjà'
      }, { status: 400 });
    }

    // Chiffrement des credentials sensibles
    let encryptedApiKey: string | undefined;
    let encryptedApiSecret: string | undefined;

    if (validatedData.apiKey) {
      const encrypted = DataEncryption.encrypt(validatedData.apiKey);
      encryptedApiKey = JSON.stringify(encrypted);
    }

    if (validatedData.apiSecret) {
      const encrypted = DataEncryption.encrypt(validatedData.apiSecret);
      encryptedApiSecret = JSON.stringify(encrypted);
    }

    // Création de l'intégration
    const integration = await prisma.integration.create({
      data: {
        name: validatedData.name,
        type: validatedData.type,
        provider: validatedData.provider,
        enabled: validatedData.enabled,
        baseUrl: validatedData.baseUrl,
        apiVersion: validatedData.apiVersion,
        timeout: validatedData.timeout,
        rateLimitRequests: validatedData.rateLimitRequests,
        rateLimitWindow: validatedData.rateLimitWindow,
        retryAttempts: validatedData.retryAttempts,
        apiKey: encryptedApiKey,
        apiSecret: encryptedApiSecret,
        settings: validatedData.settings as any,
        status: 'INACTIVE',
        createdBy: session.user.id
      }
    });

    // Initialisation de l'intégration si activée
    if (validatedData.enabled) {
      await initializeIntegration(integration.id);
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'CREATE_INTEGRATION',
      resource: 'integrations',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'MEDIUM',
      details: {
        integrationId: integration.id,
        name: integration.name,
        type: integration.type,
        provider: integration.provider
      }
    });

    // Masquer les credentials dans la réponse
    const { apiKey, apiSecret, ...safeIntegration } = integration;

    return NextResponse.json({
      success: true,
      data: {
        ...safeIntegration,
        hasCredentials: !!(apiKey && apiKey.length > 0)
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur création intégration:', error);

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

// PUT /api/admin/integrations/[id] - Mettre à jour une intégration
export async function PUT(
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

    const body = await request.json();
    const validatedData = updateIntegrationSchema.parse(body);

    // Vérifier que l'intégration existe
    const existingIntegration = await prisma.integration.findUnique({
      where: { id: params.id }
    });

    if (!existingIntegration) {
      return NextResponse.json({ error: 'Intégration non trouvée' }, { status: 404 });
    }

    // Chiffrement des nouveaux credentials
    let updateData: any = { ...validatedData };

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
      where: { id: params.id },
      data: updateData
    });

    // Re-initialisation si l'intégration était activée
    if (validatedData.enabled && !existingIntegration.enabled) {
      await initializeIntegration(params.id);
    } else if (!validatedData.enabled && existingIntegration.enabled) {
      // Désenregistrer de l'IntegrationManager
      integrationManager.get(params.id); // Si elle existe, elle sera remplacée
    }

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'UPDATE_INTEGRATION',
      resource: 'integrations',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'MEDIUM',
      details: {
        integrationId: params.id,
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

    // Vérifier l'existence
    const integration = await prisma.integration.findUnique({
      where: { id: params.id }
    });

    if (!integration) {
      return NextResponse.json({ error: 'Intégration non trouvée' }, { status: 404 });
    }

    // Suppression (cascade automatique pour logs et sync records)
    await prisma.integration.delete({
      where: { id: params.id }
    });

    // Log de sécurité
    await logSecurityEvent({
      userId: session.user.id,
      action: 'DELETE_INTEGRATION',
      resource: 'integrations',
      ipAddress: request.ip || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      success: true,
      riskLevel: 'HIGH',
      details: {
        integrationId: params.id,
        name: integration.name,
        type: integration.type
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

// Fonction utilitaire pour initialiser une intégration
async function initializeIntegration(integrationId: string): Promise<void> {
  try {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!integration || !integration.enabled) return;

    // Déchiffrement des credentials
    let apiKey: string | undefined;
    let apiSecret: string | undefined;

    if (integration.apiKey) {
      try {
        const encryptedData = JSON.parse(integration.apiKey);
        apiKey = DataEncryption.decrypt(encryptedData);
      } catch (error) {
        console.error('Erreur déchiffrement apiKey:', error);
      }
    }

    if (integration.apiSecret) {
      try {
        const encryptedData = JSON.parse(integration.apiSecret);
        apiSecret = DataEncryption.decrypt(encryptedData);
      } catch (error) {
        console.error('Erreur déchiffrement apiSecret:', error);
      }
    }

    // Configuration de l'intégration
    const config = {
      id: integration.id,
      name: integration.name,
      enabled: integration.enabled,
      baseUrl: integration.baseUrl,
      version: integration.apiVersion,
      timeout: integration.timeout,
      rateLimitRequests: integration.rateLimitRequests,
      rateLimitWindow: integration.rateLimitWindow,
      retryAttempts: integration.retryAttempts,
      apiKey,
      apiSecret,
      settings: integration.settings as any || {}
    };

    // Création de l'instance d'intégration selon le type
    let integrationInstance;

    switch (integration.type) {
      case 'ACCOUNTING':
        integrationInstance = new ComptabiliteIntegration(config);
        break;
      case 'MAPPING':
        integrationInstance = new MappingIntegration(config);
        break;
      case 'WEATHER':
        integrationInstance = new WeatherIntegration(config);
        break;
      case 'COMMUNICATION':
        integrationInstance = new CommunicationIntegration(config);
        break;
      case 'CLOUD_STORAGE':
        integrationInstance = new CloudStorageIntegration(config);
        break;
      case 'E_SIGNATURE':
        integrationInstance = new ESignatureIntegration(config);
        break;
      default:
        console.warn(`Type d'intégration non supporté: ${integration.type}`);
        return;
    }

    // Enregistrement dans le manager
    integrationManager.register(integrationInstance);

    // Test de connectivité
    const connectionTest = await integrationInstance.testConnection();
    
    // Mise à jour du statut
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: connectionTest.success ? 'ACTIVE' : 'ERROR',
        lastHealthCheck: new Date()
      }
    });

  } catch (error) {
    console.error(`Erreur initialisation intégration ${integrationId}:`, error);
    
    // Marquer comme erreur
    await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: 'ERROR',
        lastHealthCheck: new Date()
      }
    });
  }
}