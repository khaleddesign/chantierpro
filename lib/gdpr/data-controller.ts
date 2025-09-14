import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security';

/**
 * Types alignés sur le schéma Prisma
 */
export type ConsentPurpose = 'MARKETING' | 'ANALYTICS' | 'COMMUNICATION' | 'PROFILING' | 'THIRD_PARTY_SHARING' | 'COOKIES' | 'GEOLOCATION' | 'PHOTO_STORAGE';
export type DataRightsType = 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICT' | 'PORTABILITY' | 'OBJECT';
export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED';

/**
 * Interface pour les consentements RGPD
 */
export interface GDPRConsent {
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  ipAddress: string;
  userAgent: string;
}

/**
 * Contrôleur de données RGPD pour ChantierPro
 */
export class GDPRDataController {
  private static instance: GDPRDataController;

  private constructor() {}

  static getInstance(): GDPRDataController {
    if (!this.instance) {
      this.instance = new GDPRDataController();
    }
    return this.instance;
  }

  /**
   * Enregistrement d'un consentement
   */
  async recordConsent(consent: GDPRConsent): Promise<void> {
    try {
      await prisma.gDPRConsent.create({
        data: {
          userId: consent.userId,
          purpose: consent.purpose,
          granted: consent.granted,
          ipAddress: consent.ipAddress,
          userAgent: consent.userAgent
        }
      });

      // Log de l'enregistrement du consentement
      await this.logProcessingActivity({
        userId: consent.userId,
        dataType: 'PERSONAL',
        operation: 'CREATE',
        lawfulBasis: 'CONSENT',
        purpose: `Consentement pour ${consent.purpose}`,
        source: 'user_action'
      });

    } catch (error) {
      console.error('Erreur enregistrement consentement:', error);
      throw error;
    }
  }

  /**
   * Révocation d'un consentement
   */
  async withdrawConsent(userId: string, purpose: ConsentPurpose, ipAddress: string, userAgent: string): Promise<void> {
    try {
      await prisma.gDPRConsent.updateMany({
        where: {
          userId,
          purpose,
          granted: true,
          revokedAt: null
        },
        data: {
          revokedAt: new Date(),
          revokedIpAddress: ipAddress,
          revokedUserAgent: userAgent
        }
      });

      await this.logProcessingActivity({
        userId,
        dataType: 'PERSONAL',
        operation: 'UPDATE',
        lawfulBasis: 'CONSENT',
        purpose: `Révocation consentement pour ${purpose}`,
        source: 'user_action'
      });

    } catch (error) {
      console.error('Erreur révocation consentement:', error);
      throw error;
    }
  }

  /**
   * Soumission d'une demande de droits RGPD
   */
  async submitDataRightsRequest(userId: string, type: DataRightsType, requestData?: any): Promise<string> {
    try {
      const request = await prisma.dataRightsRequest.create({
        data: {
          userId,
          type,
          requestData: requestData ? JSON.stringify(requestData) : null
        }
      });

      await this.logProcessingActivity({
        userId,
        dataType: 'PERSONAL',
        operation: 'CREATE',
        lawfulBasis: 'LEGITIMATE_INTERESTS',
        purpose: `Demande de droit ${type}`,
        source: 'user_request'
      });

      return request.id;
    } catch (error) {
      console.error('Erreur soumission demande:', error);
      throw error;
    }
  }

  /**
   * Traitement d'une demande d'accès
   */
  async processAccessRequest(requestId: string, processorUserId: string): Promise<any> {
    try {
      const request = await prisma.dataRightsRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });

      if (!request || request.type !== 'ACCESS') {
        throw new Error('Demande d\'accès non trouvée');
      }

      // Collecter toutes les données de l'utilisateur
      const userData = await this.collectUserData(request.userId);

      // Mettre à jour la demande
      await prisma.dataRightsRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          processedData: JSON.stringify(userData),
          processorUserId,
          processedAt: new Date()
        }
      });

      return userData;
    } catch (error) {
      console.error('Erreur traitement demande d\'accès:', error);
      throw error;
    }
  }

  /**
   * Traitement d'une demande d'effacement
   */
  async processErasureRequest(requestId: string, processorUserId: string): Promise<void> {
    try {
      const request = await prisma.dataRightsRequest.findUnique({
        where: { id: requestId },
        include: { user: true }
      });

      if (!request || request.type !== 'ERASURE') {
        throw new Error('Demande d\'effacement non trouvée');
      }

      // Anonymiser les données de l'utilisateur
      await this.anonymizeUserData(request.userId);

      // Mettre à jour la demande
      await prisma.dataRightsRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          processorUserId,
          processedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Erreur traitement demande d\'effacement:', error);
      throw error;
    }
  }

  /**
   * Collecte de toutes les données d'un utilisateur
   */
  private async collectUserData(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          chantiers: true,
          devis: true,
          messages: true,
          comments: true,
          documents: true,
          notifications: true,
          gdprConsents: true,
          dataRightsRequests: true,
          processingLogs: true
        }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Masquer les données sensibles
      const { password, twoFactorSecret, backupCodes, ...safeUserData } = user;

      return {
        user: safeUserData,
        metadata: {
          exportedAt: new Date().toISOString(),
          dataTypes: ['profile', 'chantiers', 'devis', 'messages', 'documents'],
          totalRecords: Object.keys(safeUserData).length
        }
      };
    } catch (error) {
      console.error('Erreur collecte données utilisateur:', error);
      throw error;
    }
  }

  /**
   * Anonymisation des données d'un utilisateur
   */
  private async anonymizeUserData(userId: string): Promise<void> {
    try {
      const timestamp = new Date();
      const anonymizedEmail = `deleted_${timestamp.getTime()}@anonymized.local`;
      
      await prisma.$transaction(async (tx) => {
        // Anonymiser les données utilisateur
        await tx.user.update({
          where: { id: userId },
          data: {
            email: anonymizedEmail,
            name: 'Utilisateur supprimé',
            nom: 'Anonyme',
            phone: null,
            company: null,
            address: null,
            image: null,
            // Garder l'ID pour l'intégrité référentielle
          }
        });

        // Anonymiser les messages
        await tx.message.updateMany({
          where: { expediteurId: userId },
          data: {
            message: '[Message supprimé]',
            photos: null
          }
        });

        // Anonymiser les commentaires
        await tx.comment.updateMany({
          where: { auteurId: userId },
          data: {
            message: '[Commentaire supprimé]',
            photos: null
          }
        });

        // Supprimer les documents personnels
        await tx.document.deleteMany({
          where: { uploaderId: userId }
        });
      });

      await this.logProcessingActivity({
        userId,
        dataType: 'PERSONAL',
        operation: 'ANONYMIZE',
        lawfulBasis: 'LEGITIMATE_INTERESTS',
        purpose: 'Droit à l\'oubli RGPD',
        source: 'admin_action'
      });

    } catch (error) {
      console.error('Erreur anonymisation:', error);
      throw error;
    }
  }

  /**
   * Log d'activité de traitement RGPD
   */
  private async logProcessingActivity(data: {
    userId: string;
    dataType: string;
    operation: string;
    lawfulBasis: string;
    purpose: string;
    source: string;
  }): Promise<void> {
    try {
      await prisma.gDPRProcessingLog.create({
        data: {
          userId: data.userId,
          dataType: data.dataType as any,
          operation: data.operation as any,
          lawfulBasis: data.lawfulBasis as any,
          purpose: data.purpose,
          source: data.source
        }
      });
    } catch (error) {
      console.error('Erreur log activité:', error);
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Méthodes pour l'API Admin
   */

  async getUserConsents(userId: string) {
    return await prisma.gDPRConsent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });
  }

  async getProcessingLogs(userId?: string, options?: { startDate?: string; endDate?: string }) {
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (options?.startDate) {
      where.timestamp = { gte: new Date(options.startDate) };
    }
    
    if (options?.endDate) {
      where.timestamp = { ...where.timestamp, lte: new Date(options.endDate) };
    }

    return await prisma.gDPRProcessingLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100
    });
  }

  async getDataRightsRequests(userId: string) {
    return await prisma.dataRightsRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getRetentionPolicies() {
    return await prisma.dataRetention.findMany({
      orderBy: { dataType: 'asc' }
    });
  }

  async getPendingDataRightsRequests() {
    return await prisma.dataRightsRequest.findMany({
      where: { status: 'PENDING' },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'asc' }
    });
  }

  async getAllDataRightsRequests(filters?: { status?: string; type?: string }) {
    const where: any = {};
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    if (filters?.type) {
      where.type = filters.type;
    }

    return await prisma.dataRightsRequest.findMany({
      where,
      include: { 
        user: { select: { name: true, email: true } },
        processor: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getConsentsOverview() {
    const consents = await prisma.gDPRConsent.groupBy({
      by: ['purpose'],
      _count: { granted: true },
      where: { granted: true, revokedAt: null }
    });

    return consents.map(c => ({
      purpose: c.purpose,
      activeConsents: c._count.granted
    }));
  }

  async getDataRetentionReport() {
    return await prisma.dataRetention.findMany({
      orderBy: { dataType: 'asc' }
    });
  }

  async getDataBreaches() {
    return await prisma.dataBreach.findMany({
      orderBy: { detectedAt: 'desc' },
      take: 20
    });
  }

  async generateComplianceReport() {
    const [totalUsers, activeConsents, pendingRequests, recentBreaches] = await Promise.all([
      prisma.user.count(),
      prisma.gDPRConsent.count({ where: { granted: true, revokedAt: null } }),
      prisma.dataRightsRequest.count({ where: { status: 'PENDING' } }),
      prisma.dataBreach.count({
        where: {
          detectedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
          }
        }
      })
    ]);

    return {
      totalUsers,
      activeConsents,
      pendingRequests,
      recentBreaches,
      generatedAt: new Date().toISOString()
    };
  }

  async approveDataRightsRequest(requestId: string, processorUserId: string, note?: string) {
    await prisma.dataRightsRequest.update({
      where: { id: requestId },
      data: {
        status: 'IN_PROGRESS',
        processorUserId,
        responseNote: note,
        updatedAt: new Date()
      }
    });
  }

  async rejectDataRightsRequest(requestId: string, processorUserId: string, note?: string) {
    await prisma.dataRightsRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        processorUserId,
        responseNote: note,
        updatedAt: new Date()
      }
    });
  }

  async reportDataBreach(data: {
    title: string;
    description: string;
    severity: string;
    affectedDataTypes: string[];
    affectedUsersCount?: number;
    reportedBy: string;
    occurredAt?: Date;
  }) {
    const breach = await prisma.dataBreach.create({
      data: {
        title: data.title,
        description: data.description,
        severity: data.severity as any,
        affectedDataTypes: JSON.stringify(data.affectedDataTypes),
        affectedUsersCount: data.affectedUsersCount,
        reportedBy: data.reportedBy,
        occurredAt: data.occurredAt || new Date()
      }
    });

    return breach.id;
  }

  async cleanupExpiredData() {
    // Implémentation du nettoyage automatique des données expirées
    const policies = await prisma.dataRetention.findMany();
    let deletedRecords = 0;
    const processedTables: string[] = [];

    for (const policy of policies) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - policy.retentionDays);

      // Logique de suppression selon le type de données
      // À implémenter selon les besoins spécifiques
      processedTables.push(policy.dataType);
    }

    return { deletedRecords, processedTables };
  }

  async updateRetentionPolicy(dataType: string, category: string, data: {
    retentionDays: number;
    lawfulBasis: string;
  }) {
    await prisma.dataRetention.upsert({
      where: { dataType_category: { dataType: dataType as any, category } },
      create: {
        dataType: dataType as any,
        category,
        retentionDays: data.retentionDays,
        lawfulBasis: data.lawfulBasis as any
      },
      update: {
        retentionDays: data.retentionDays,
        lawfulBasis: data.lawfulBasis as any,
        updatedAt: new Date()
      }
    });
  }

  async updateBreachStatus(breachId: string, status: string, notes?: string) {
    await prisma.dataBreach.update({
      where: { id: breachId },
      data: {
        status: status as any,
        updatedAt: new Date(),
        // Ajouter les notes aux actions de mitigation
        mitigationActions: notes ? JSON.stringify([{ note: notes, timestamp: new Date() }]) : undefined
      }
    });
  }

  async exportUserData(userId: string) {
    return await this.collectUserData(userId);
  }

  async executeAnonymization(userId: string): Promise<void> {
    return await this.anonymizeUserData(userId);
  }
}

// Instance singleton
export const gdprController = GDPRDataController.getInstance();