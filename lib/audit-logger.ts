import { prisma } from '@/lib/prisma';

export interface SecurityAction {
  userId: string;
  action: string;
  resource: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  ip: string | null;
  userAgent: string | null;
  timestamp: Date;
  details: any;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * Enregistre une action de sécurité dans le système d'audit
 * @param action - Détails de l'action à enregistrer
 */
export async function logSecurityAction(action: SecurityAction): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: action.userId,
        action: action.action,
        resource: action.resource,
        ip: action.ip || null,
        userAgent: action.userAgent || null,
        details: action.details || {},
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'action de sécurité:', error);
    // Ne pas faire échouer l'opération principale en cas d'erreur d'audit
  }
}

/**
 * Récupère les logs d'audit avec filtres optionnels
 * @param filters - Filtres à appliquer
 * @param limit - Nombre maximum de résultats
 * @param offset - Décalage pour la pagination
 */
export async function getAuditLogs(
  filters: {
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
  } = {},
  limit: number = 100,
  offset: number = 0
): Promise<{ logs: AuditLog[]; total: number }> {
  try {
    const where: any = {};
    
    if (filters.userId) {
      where.userId = filters.userId;
    }
    
    if (filters.action) {
      where.action = filters.action;
    }
    
    if (filters.resource) {
      where.resource = {
        contains: filters.resource,
        mode: 'insensitive',
      };
    }
    
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.lte = filters.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  } catch (error) {
    console.error('Erreur lors de la récupération des logs d\'audit:', error);
    throw error;
  }
}

/**
 * Actions de sécurité prédéfinies
 */
export const SecurityActions = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  ACCESS_DENIED: 'ACCESS_DENIED',
  CHANTIER_CREATE: 'CHANTIER_CREATE',
  CHANTIER_UPDATE: 'CHANTIER_UPDATE',
  CHANTIER_DELETE: 'CHANTIER_UPDATE',
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  TWO_FA_SUCCESS: 'TWO_FA_SUCCESS',
  TWO_FA_FAILED: 'TWO_FA_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PERMISSION_CHANGE: 'PERMISSION_CHANGE',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  SYSTEM_ACCESS: 'SYSTEM_ACCESS',
} as const;

/**
 * Types de ressources pour l'audit
 */
export const ResourceTypes = {
  CHANTIER: 'chantier',
  USER: 'user',
  DEVIS: 'devis',
  DOCUMENT: 'document',
  SYSTEM: 'system',
  AUTH: 'auth',
} as const;

/**
 * Helper pour créer un log d'accès refusé
 */
export async function logAccessDenied(
  userId: string,
  resource: string,
  ip?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logSecurityAction({
    userId,
    action: SecurityActions.ACCESS_DENIED,
    resource,
    ip,
    userAgent,
    details: { reason: reason || 'insufficient_permissions' },
  });
}

/**
 * Helper pour créer un log de connexion réussie
 */
export async function logLoginSuccess(
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityAction({
    userId,
    action: SecurityActions.LOGIN_SUCCESS,
    resource: ResourceTypes.AUTH,
    ip,
    userAgent,
    details: { timestamp: new Date().toISOString() },
  });
}

/**
 * Helper pour créer un log d'échec de connexion
 */
export async function logLoginFailed(
  email: string,
  ip?: string,
  userAgent?: string,
  reason?: string
): Promise<void> {
  await logSecurityAction({
    userId: 'anonymous', // Utilisateur non identifié
    action: SecurityActions.LOGIN_FAILED,
    resource: ResourceTypes.AUTH,
    ip,
    userAgent,
    details: { 
      email,
      reason: reason || 'invalid_credentials',
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Helper pour créer un log de modification de chantier
 */
export async function logChantierAction(
  userId: string,
  action: string,
  chantierId: string,
  ip?: string,
  userAgent?: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityAction({
    userId,
    action,
    resource: `${ResourceTypes.CHANTIER}:${chantierId}`,
    ip,
    userAgent,
    details: {
      chantierId,
      ...details,
    },
  });
}

/**
 * Helper pour créer un log d'action 2FA
 */
export async function logTwoFactorAction(
  userId: string,
  success: boolean,
  ip?: string,
  userAgent?: string,
  details?: Record<string, any>
): Promise<void> {
  await logSecurityAction({
    userId,
    action: success ? SecurityActions.TWO_FA_SUCCESS : SecurityActions.TWO_FA_FAILED,
    resource: ResourceTypes.AUTH,
    ip,
    userAgent,
    details: {
      success,
      timestamp: new Date().toISOString(),
      ...details,
    },
  });
}
