import { prisma } from '@/lib/prisma';
import { biEngine } from './business-intelligence';
import { integrationManager } from '@/lib/integrations/base';
import { logSecurityEvent } from '@/lib/security';
import { cache } from '@/lib/cache';

/**
 * Interface pour les paramètres d'alerte
 */
export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'GREATER_THAN' | 'LESS_THAN' | 'EQUAL' | 'NOT_EQUAL' | 'GREATER_OR_EQUAL' | 'LESS_OR_EQUAL';
  threshold: number;
  frequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  enabled: boolean;
  conditions?: Record<string, any>;
  actions: AlertAction[];
}

export interface AlertAction {
  type: 'EMAIL' | 'SMS' | 'WEBHOOK' | 'NOTIFICATION';
  target: string;
  template?: string;
  parameters?: Record<string, any>;
}

export interface AlertTrigger {
  alertId: string;
  value: number;
  threshold: number;
  metric: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Système d'alertes automatiques pour Business Intelligence
 */
export class BIAlertSystem {
  private static instance: BIAlertSystem;
  private isRunning = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): BIAlertSystem {
    if (!this.instance) {
      this.instance = new BIAlertSystem();
    }
    return this.instance;
  }

  /**
   * Démarre le système d'alertes
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚡ Système d\'alertes BI déjà en cours d\'exécution');
      return;
    }

    console.log('🚀 Démarrage du système d\'alertes BI...');

    try {
      // Charger toutes les alertes actives
      const activeAlerts = await prisma.bIAlert.findMany({
        where: { enabled: true }
      });

      console.log(`📊 ${activeAlerts.length} alerte(s) active(s) chargée(s)`);

      // Programmer chaque alerte
      for (const alert of activeAlerts) {
        await this.scheduleAlert(alert);
      }

      this.isRunning = true;
      console.log('✅ Système d\'alertes BI démarré avec succès');

      // Programmer la vérification périodique des nouvelles alertes
      this.scheduleAlertReload();

    } catch (error) {
      console.error('❌ Erreur démarrage système d\'alertes:', error);
      throw error;
    }
  }

  /**
   * Arrête le système d'alertes
   */
  async stop(): Promise<void> {
    console.log('🔌 Arrêt du système d\'alertes BI...');

    // Nettoyer tous les intervals
    for (const [alertId, interval] of this.intervals) {
      clearInterval(interval);
      this.intervals.delete(alertId);
    }

    this.isRunning = false;
    console.log('✅ Système d\'alertes BI arrêté');
  }

  /**
   * Ajoute une nouvelle alerte
   */
  async addAlert(alertRule: Omit<AlertRule, 'id'>): Promise<string> {
    try {
      const alert = await prisma.bIAlert.create({
        data: {
          name: alertRule.name,
          metric: alertRule.metric,
          operator: alertRule.operator,
          threshold: alertRule.threshold,
          frequency: alertRule.frequency,
          enabled: alertRule.enabled,
          conditions: alertRule.conditions as any,
          actions: alertRule.actions as any,
          createdBy: 'system' // À adapter selon le contexte
        }
      });

      // Programmer l'alerte si elle est activée
      if (alertRule.enabled) {
        await this.scheduleAlert(alert);
      }

      console.log(`➕ Alerte "${alertRule.name}" ajoutée avec succès`);
      return alert.id;

    } catch (error) {
      console.error('Erreur ajout alerte:', error);
      throw error;
    }
  }

  /**
   * Programme une alerte selon sa fréquence
   */
  private async scheduleAlert(alert: any): Promise<void> {
    try {
      // Nettoyer l'interval existant si présent
      if (this.intervals.has(alert.id)) {
        clearInterval(this.intervals.get(alert.id)!);
      }

      let intervalMs: number;

      switch (alert.frequency) {
        case 'REAL_TIME':
          intervalMs = 60 * 1000; // 1 minute (pseudo temps réel)
          break;
        case 'HOURLY':
          intervalMs = 60 * 60 * 1000; // 1 heure
          break;
        case 'DAILY':
          intervalMs = 24 * 60 * 60 * 1000; // 24 heures
          break;
        case 'WEEKLY':
          intervalMs = 7 * 24 * 60 * 60 * 1000; // 7 jours
          break;
        case 'MONTHLY':
          intervalMs = 30 * 24 * 60 * 60 * 1000; // 30 jours
          break;
        default:
          intervalMs = 60 * 60 * 1000; // 1 heure par défaut
      }

      // Créer l'interval
      const interval = setInterval(async () => {
        await this.checkAlert(alert);
      }, intervalMs);

      this.intervals.set(alert.id, interval);

      // Vérification initiale
      await this.checkAlert(alert);

      console.log(`⏰ Alerte "${alert.name}" programmée (${alert.frequency})`);

    } catch (error) {
      console.error(`Erreur programmation alerte ${alert.id}:`, error);
    }
  }

  /**
   * Vérifie une alerte spécifique
   */
  private async checkAlert(alert: any): Promise<void> {
    try {
      // Récupération de la valeur actuelle de la métrique
      const currentValue = await this.getMetricValue(alert.metric, alert.conditions);

      if (currentValue === null) {
        console.warn(`⚠️ Impossible de récupérer la valeur pour la métrique ${alert.metric}`);
        return;
      }

      // Vérification du seuil
      const shouldTrigger = this.evaluateCondition(
        currentValue,
        alert.operator,
        alert.threshold
      );

      if (shouldTrigger) {
        await this.triggerAlert({
          alertId: alert.id,
          value: currentValue,
          threshold: alert.threshold,
          metric: alert.metric,
          timestamp: new Date(),
          metadata: {
            operator: alert.operator,
            conditions: alert.conditions
          }
        });

        // Mise à jour des statistiques de l'alerte
        await prisma.bIAlert.update({
          where: { id: alert.id },
          data: {
            lastTriggered: new Date(),
            triggerCount: { increment: 1 }
          }
        });

        console.log(`🚨 Alerte déclenchée: ${alert.name} (${currentValue} ${alert.operator} ${alert.threshold})`);
      }

      // Mise à jour de la dernière vérification
      await prisma.bIAlert.update({
        where: { id: alert.id },
        data: { lastCheck: new Date() }
      });

    } catch (error) {
      console.error(`Erreur vérification alerte ${alert.id}:`, error);
    }
  }

  /**
   * Récupère la valeur actuelle d'une métrique
   */
  private async getMetricValue(metric: string, conditions?: any): Promise<number | null> {
    try {
      const cacheKey = `alert_metric_${metric}_${JSON.stringify(conditions || {})}`;
      
      // Tentative de récupération depuis le cache (courte durée)
      const cached = await cache.get<number>(cacheKey);
      if (cached !== null) {
        return cached;
      }

      let value: number | null = null;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      switch (metric) {
        case 'chiffre_affaires_mensuel':
          const ca = await prisma.devis.aggregate({
            _sum: { totalTTC: true },
            where: {
              statut: { in: ['ACCEPTE', 'PAYE'] },
              dateCreation: { gte: startOfMonth }
            }
          });
          value = ca._sum.totalTTC || 0;
          break;

        case 'marge_moyenne':
          const marges = await prisma.$queryRaw`
            SELECT AVG((COALESCE(d.totalTTC, d.montant) - ch.budget) / COALESCE(d.totalTTC, d.montant) * 100) as marge
            FROM Chantier ch
            JOIN Devis d ON d.chantierId = ch.id
            WHERE d.statut IN ('ACCEPTE', 'PAYE')
              AND ch.dateDebut >= ${startOfMonth.toISOString()}
          ` as any[];
          value = marges[0]?.marge || 0;
          break;

        case 'delai_paiement_moyen':
          const paiements = await prisma.paiement.findMany({
            where: {
              datePaiement: { gte: startOfMonth }
            },
            include: { facture: true }
          });

          if (paiements.length > 0) {
            const delais = paiements.map(p => {
              return (p.datePaiement.getTime() - p.facture.dateEcheance.getTime()) / (1000 * 60 * 60 * 24);
            });
            value = delais.reduce((sum, delai) => sum + delai, 0) / delais.length;
          }
          break;

        case 'taux_realisation':
          const [chantiersTermines, chantiersTotal] = await Promise.all([
            prisma.chantier.count({
              where: {
                statut: 'TERMINE',
                dateDebut: { gte: startOfMonth }
              }
            }),
            prisma.chantier.count({
              where: {
                dateDebut: { gte: startOfMonth }
              }
            })
          ]);
          value = chantiersTotal > 0 ? (chantiersTermines / chantiersTotal) * 100 : 0;
          break;

        case 'nombre_clients_risque':
          // Clients avec retard de paiement > 30 jours
          const clientsRisque = await prisma.$queryRaw`
            SELECT COUNT(DISTINCT u.id) as count
            FROM User u
            JOIN Devis d ON d.clientId = u.id
            WHERE d.statut = 'ACCEPTE'
              AND d.dateEcheance < datetime('now', '-30 days')
          ` as any[];
          value = clientsRisque[0]?.count || 0;
          break;

        default:
          console.warn(`Métrique non supportée: ${metric}`);
          return null;
      }

      // Mise en cache pour 5 minutes
      if (value !== null) {
        await cache.set(cacheKey, value, 5 * 60 * 1000, ['alert_metrics']);
      }

      return value;

    } catch (error) {
      console.error(`Erreur récupération métrique ${metric}:`, error);
      return null;
    }
  }

  /**
   * Évalue une condition d'alerte
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'GREATER_THAN':
        return value > threshold;
      case 'LESS_THAN':
        return value < threshold;
      case 'EQUAL':
        return value === threshold;
      case 'NOT_EQUAL':
        return value !== threshold;
      case 'GREATER_OR_EQUAL':
        return value >= threshold;
      case 'LESS_OR_EQUAL':
        return value <= threshold;
      default:
        return false;
    }
  }

  /**
   * Déclenche une alerte
   */
  private async triggerAlert(trigger: AlertTrigger): Promise<void> {
    try {
      // Enregistrement de la notification
      const notification = await prisma.bIAlertNotification.create({
        data: {
          alertId: trigger.alertId,
          value: trigger.value,
          threshold: trigger.threshold,
          triggeredAt: trigger.timestamp,
          status: 'PENDING',
          details: trigger.metadata as any
        }
      });

      // Récupération des actions à exécuter
      const alert = await prisma.bIAlert.findUnique({
        where: { id: trigger.alertId }
      });

      if (!alert || !alert.actions) {
        console.warn(`Aucune action configurée pour l'alerte ${trigger.alertId}`);
        return;
      }

      const actions = alert.actions as any as AlertAction[];

      // Exécution des actions
      for (const action of actions) {
        try {
          await this.executeAction(action, alert, trigger);
        } catch (error) {
          console.error(`Erreur exécution action ${action.type}:`, error);
        }
      }

      // Mise à jour du statut de notification
      await prisma.bIAlertNotification.update({
        where: { id: notification.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });

      // Log de sécurité
      await logSecurityEvent({
        action: 'BI_ALERT_TRIGGERED',
        resource: 'business_intelligence',
        ipAddress: 'system',
        userAgent: 'ChantierPro/AlertSystem',
        success: true,
        riskLevel: 'MEDIUM',
        details: {
          alertId: trigger.alertId,
          metric: trigger.metric,
          value: trigger.value,
          threshold: trigger.threshold,
          alertName: alert.name
        }
      });

    } catch (error) {
      console.error('Erreur déclenchement alerte:', error);
      throw error;
    }
  }

  /**
   * Exécute une action d'alerte
   */
  private async executeAction(action: AlertAction, alert: any, trigger: AlertTrigger): Promise<void> {
    switch (action.type) {
      case 'EMAIL':
        await this.sendEmailAlert(action, alert, trigger);
        break;

      case 'SMS':
        await this.sendSMSAlert(action, alert, trigger);
        break;

      case 'WEBHOOK':
        await this.sendWebhookAlert(action, alert, trigger);
        break;

      case 'NOTIFICATION':
        await this.createNotificationAlert(action, alert, trigger);
        break;

      default:
        console.warn(`Type d'action non supporté: ${action.type}`);
    }
  }

  private async sendEmailAlert(action: AlertAction, alert: any, trigger: AlertTrigger): Promise<void> {
    // Intégration avec le service de communication
    const communicationIntegration = integrationManager.get('communication');
    
    if (communicationIntegration) {
      const subject = `Alerte ChantierPro: ${alert.name}`;
      const content = this.generateAlertMessage(alert, trigger, 'html');

      await (communicationIntegration as any).sendEmail({
        to: action.target,
        subject,
        htmlContent: content
      });
    } else {
      console.log(`📧 EMAIL ALERT: ${alert.name} - ${trigger.value} (seuil: ${trigger.threshold})`);
    }
  }

  private async sendSMSAlert(action: AlertAction, alert: any, trigger: AlertTrigger): Promise<void> {
    const communicationIntegration = integrationManager.get('communication');
    
    if (communicationIntegration) {
      const content = this.generateAlertMessage(alert, trigger, 'text');

      await (communicationIntegration as any).sendSMS({
        to: action.target,
        content,
        sender: 'ChantierPro'
      });
    } else {
      console.log(`📱 SMS ALERT: ${alert.name} - ${trigger.value} (seuil: ${trigger.threshold})`);
    }
  }

  private async sendWebhookAlert(action: AlertAction, alert: any, trigger: AlertTrigger): Promise<void> {
    try {
      const payload = {
        alert: {
          id: alert.id,
          name: alert.name,
          metric: alert.metric
        },
        trigger: {
          value: trigger.value,
          threshold: trigger.threshold,
          timestamp: trigger.timestamp.toISOString()
        }
      };

      await fetch(action.target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Erreur envoi webhook:', error);
    }
  }

  private async createNotificationAlert(action: AlertAction, alert: any, trigger: AlertTrigger): Promise<void> {
    // Création d'une notification en base pour l'utilisateur
    await prisma.notification.create({
      data: {
        userId: action.target,
        titre: `Alerte: ${alert.name}`,
        message: this.generateAlertMessage(alert, trigger, 'text'),
        type: 'WARNING'
      }
    });
  }

  private generateAlertMessage(alert: any, trigger: AlertTrigger, format: 'text' | 'html'): string {
    const message = `L'alerte "${alert.name}" a été déclenchée.\n\n` +
                   `Métrique: ${alert.metric}\n` +
                   `Valeur actuelle: ${trigger.value}\n` +
                   `Seuil configuré: ${trigger.threshold}\n` +
                   `Date: ${trigger.timestamp.toLocaleString('fr-FR')}`;

    if (format === 'html') {
      return message.replace(/\n/g, '<br>');
    }

    return message;
  }

  /**
   * Recharge périodiquement les alertes depuis la base
   */
  private scheduleAlertReload(): void {
    setInterval(async () => {
      try {
        // Recharger les alertes actives
        const activeAlerts = await prisma.bIAlert.findMany({
          where: { enabled: true }
        });

        // Identifier les nouvelles alertes ou celles modifiées
        for (const alert of activeAlerts) {
          if (!this.intervals.has(alert.id)) {
            await this.scheduleAlert(alert);
          }
        }

        // Supprimer les alertes désactivées ou supprimées
        const activeIds = new Set(activeAlerts.map(a => a.id));
        for (const alertId of this.intervals.keys()) {
          if (!activeIds.has(alertId)) {
            clearInterval(this.intervals.get(alertId)!);
            this.intervals.delete(alertId);
            console.log(`🗑️ Alerte ${alertId} supprimée du planning`);
          }
        }

      } catch (error) {
        console.error('Erreur rechargement alertes:', error);
      }
    }, 10 * 60 * 1000); // Toutes les 10 minutes
  }
}

// Instance singleton
export const biAlertSystem = BIAlertSystem.getInstance();

// Fonction d'initialisation
export async function initializeBIAlerts(): Promise<void> {
  return biAlertSystem.start();
}

// Fonction d'arrêt
export async function shutdownBIAlerts(): Promise<void> {
  return biAlertSystem.stop();
}