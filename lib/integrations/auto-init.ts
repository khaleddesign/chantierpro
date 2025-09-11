import { prisma } from '@/lib/prisma';
import { integrationManager } from './base';
import { ComptabiliteIntegration } from './accounting';
import { MappingIntegration, WeatherIntegration, CommunicationIntegration, CloudStorageIntegration, ESignatureIntegration } from './external-services';
import { DataEncryption, logSecurityEvent } from '@/lib/security';

/**
 * Service d'initialisation automatique des intégrations
 * À appeler au démarrage de l'application
 */
export class IntegrationAutoInit {
  private static instance: IntegrationAutoInit;
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): IntegrationAutoInit {
    if (!this.instance) {
      this.instance = new IntegrationAutoInit();
    }
    return this.instance;
  }

  /**
   * Initialise toutes les intégrations actives au démarrage
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('🚀 Initialisation des intégrations externes...');

      // Récupération des intégrations actives
      const activeIntegrations = await prisma.integration.findMany({
        where: { enabled: true }
      });

      console.log(`📡 ${activeIntegrations.length} intégration(s) active(s) trouvée(s)`);

      let successCount = 0;
      let errorCount = 0;

      // Initialisation de chaque intégration
      for (const integration of activeIntegrations) {
        try {
          await this.initializeIntegration(integration);
          successCount++;
          console.log(`✅ ${integration.name} (${integration.provider}) initialisée`);
        } catch (error) {
          errorCount++;
          console.error(`❌ Erreur initialisation ${integration.name}:`, error);
          
          // Marquer comme erreur en BDD
          await prisma.integration.update({
            where: { id: integration.id },
            data: { 
              status: 'ERROR',
              lastHealthCheck: new Date()
            }
          });

          // Log de sécurité
          await logSecurityEvent({
            action: 'INTEGRATION_INIT_ERROR',
            resource: 'integrations',
            ipAddress: 'system',
            userAgent: 'ChantierPro/AutoInit',
            success: false,
            riskLevel: 'MEDIUM',
            details: {
              integrationId: integration.id,
              name: integration.name,
              provider: integration.provider,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          });
        }
      }

      // Health check initial pour toutes les intégrations
      if (successCount > 0) {
        console.log('🔍 Health check initial des intégrations...');
        await this.performInitialHealthCheck();
      }

      this.initialized = true;
      console.log(`✅ Intégrations initialisées: ${successCount} succès, ${errorCount} erreurs`);

      // Programmer le health check périodique
      this.schedulePeriodicHealthCheck();

    } catch (error) {
      console.error('❌ Erreur critique lors de l\'initialisation des intégrations:', error);
      throw error;
    }
  }

  /**
   * Initialise une intégration spécifique
   */
  private async initializeIntegration(integration: any): Promise<void> {
    // Déchiffrement des credentials
    let apiKey: string | undefined;
    let apiSecret: string | undefined;

    if (integration.apiKey) {
      try {
        const encryptedData = JSON.parse(integration.apiKey);
        apiKey = DataEncryption.decrypt(encryptedData);
      } catch (error) {
        console.warn(`Erreur déchiffrement apiKey pour ${integration.name}:`, error);
      }
    }

    if (integration.apiSecret) {
      try {
        const encryptedData = JSON.parse(integration.apiSecret);
        apiSecret = DataEncryption.decrypt(encryptedData);
      } catch (error) {
        console.warn(`Erreur déchiffrement apiSecret pour ${integration.name}:`, error);
      }
    }

    // Configuration
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
      settings: integration.settings || {}
    };

    // Création de l'instance selon le type
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
        throw new Error(`Type d'intégration non supporté: ${integration.type}`);
    }

    // Enregistrement dans le manager
    integrationManager.register(integrationInstance);
  }

  /**
   * Health check initial de toutes les intégrations
   */
  private async performInitialHealthCheck(): Promise<void> {
    try {
      const healthResults = await integrationManager.healthCheckAll();
      
      for (const [integrationId, healthResult] of Object.entries(healthResults)) {
        let status: 'ACTIVE' | 'DEGRADED' | 'ERROR' = 'ACTIVE';
        
        switch (healthResult.status) {
          case 'healthy':
            status = 'ACTIVE';
            break;
          case 'degraded':
            status = 'DEGRADED';
            break;
          case 'unhealthy':
            status = 'ERROR';
            break;
        }

        // Mise à jour du statut en BDD
        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            status,
            lastHealthCheck: new Date()
          }
        });
      }

      console.log('🔍 Health check initial terminé');
    } catch (error) {
      console.error('Erreur health check initial:', error);
    }
  }

  /**
   * Programme le health check périodique (toutes les 5 minutes)
   */
  private schedulePeriodicHealthCheck(): void {
    const interval = 5 * 60 * 1000; // 5 minutes

    setInterval(async () => {
      try {
        await this.performPeriodicHealthCheck();
      } catch (error) {
        console.error('Erreur health check périodique:', error);
      }
    }, interval);

    console.log('⏱️ Health check périodique programmé (toutes les 5 minutes)');
  }

  /**
   * Health check périodique
   */
  private async performPeriodicHealthCheck(): Promise<void> {
    const healthResults = await integrationManager.healthCheckAll();
    const timestamp = new Date();

    for (const [integrationId, healthResult] of Object.entries(healthResults)) {
      let status: 'ACTIVE' | 'DEGRADED' | 'ERROR' = 'ACTIVE';
      let shouldLog = false;

      // Déterminer le nouveau statut
      switch (healthResult.status) {
        case 'healthy':
          status = 'ACTIVE';
          break;
        case 'degraded':
          status = 'DEGRADED';
          shouldLog = true;
          break;
        case 'unhealthy':
          status = 'ERROR';
          shouldLog = true;
          break;
      }

      // Récupérer le statut actuel
      const currentIntegration = await prisma.integration.findUnique({
        where: { id: integrationId },
        select: { status: true, name: true, provider: true }
      });

      // Mise à jour si changement de statut
      if (currentIntegration && currentIntegration.status !== status) {
        await prisma.integration.update({
          where: { id: integrationId },
          data: {
            status,
            lastHealthCheck: timestamp
          }
        });

        console.log(`🔄 ${currentIntegration.name}: ${currentIntegration.status} → ${status}`);

        // Log de sécurité pour les changements significatifs
        if (shouldLog || status === 'ERROR') {
          await logSecurityEvent({
            action: 'INTEGRATION_STATUS_CHANGE',
            resource: 'integrations',
            ipAddress: 'system',
            userAgent: 'ChantierPro/HealthCheck',
            success: status !== 'ERROR',
            riskLevel: status === 'ERROR' ? 'HIGH' : 'MEDIUM',
            details: {
              integrationId,
              name: currentIntegration.name,
              provider: currentIntegration.provider,
              oldStatus: currentIntegration.status,
              newStatus: status,
              healthDetails: healthResult.details
            }
          });
        }
      } else if (currentIntegration) {
        // Simple mise à jour du timestamp même sans changement
        await prisma.integration.update({
          where: { id: integrationId },
          data: { lastHealthCheck: timestamp }
        });
      }
    }
  }

  /**
   * Synchronisation automatique programmée (optionnel)
   */
  async scheduleAutoSync(): Promise<void> {
    try {
      // Récupération des intégrations avec auto-sync activé
      const syncIntegrations = await prisma.integration.findMany({
        where: {
          enabled: true,
          status: 'ACTIVE',
          // Vérifier si auto-sync est activé dans les settings
          // settings: { path: ['autoSync'], equals: true }
        }
      });

      for (const integration of syncIntegrations) {
        // Programme la synchronisation selon la configuration
        const settings = integration.settings as any || {};
        const syncInterval = settings.autoSyncInterval || 3600000; // 1 heure par défaut

        if (settings.autoSync) {
          setInterval(async () => {
            try {
              const integrationInstance = integrationManager.get(integration.id);
              if (integrationInstance) {
                console.log(`🔄 Auto-sync: ${integration.name}`);
                await integrationInstance.syncData();
              }
            } catch (error) {
              console.error(`Erreur auto-sync ${integration.name}:`, error);
            }
          }, syncInterval);

          console.log(`⏰ Auto-sync programmé pour ${integration.name} (interval: ${syncInterval}ms)`);
        }
      }
    } catch (error) {
      console.error('Erreur programmation auto-sync:', error);
    }
  }

  /**
   * Nettoyage et arrêt propre
   */
  async shutdown(): Promise<void> {
    console.log('🔌 Arrêt des intégrations...');
    // Ici on pourrait implémenter un arrêt propre des intégrations
    // Par exemple, terminer les requêtes en cours, fermer les connexions, etc.
    this.initialized = false;
  }
}

// Instance singleton
export const integrationAutoInit = IntegrationAutoInit.getInstance();

// Fonction d'initialisation à appeler au démarrage de l'app
export async function initializeIntegrations(): Promise<void> {
  return integrationAutoInit.initialize();
}

// Fonction pour programmer l'auto-sync (optionnel)
export async function scheduleAutoSync(): Promise<void> {
  return integrationAutoInit.scheduleAutoSync();
}

// Fonction d'arrêt propre
export async function shutdownIntegrations(): Promise<void> {
  return integrationAutoInit.shutdown();
}