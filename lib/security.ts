import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import crypto from 'crypto';

// Interface pour les logs de sécurité
interface SecurityLog {
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details?: any;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Rate Limiting en mémoire (en production, utiliser Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Système de détection d'anomalies
const anomalyDetector = {
  // Détection de tentatives de force brute
  bruteForceAttempts: new Map<string, { attempts: number; lastAttempt: number }>(),
  
  // Détection d'accès suspects
  suspiciousActivities: new Map<string, { activities: string[]; score: number }>(),
  
  // Liste des IPs suspectes
  suspiciousIPs: new Set<string>()
};

/**
 * Rate Limiting avancé
 */
export function rateLimiter(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): boolean {
  const now = Date.now();
  const key = identifier;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    // Log de sécurité pour rate limiting dépassé
    logSecurityEvent({
      action: 'RATE_LIMIT_EXCEEDED',
      resource: 'API',
      ipAddress: identifier,
      userAgent: 'Unknown',
      success: false,
      riskLevel: 'MEDIUM',
      details: { maxRequests, windowMs, currentCount: current.count }
    });
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * Validation des permissions avec audit
 */
export async function checkPermission(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    if (!user) {
      await logSecurityEvent({
        userId,
        action: 'PERMISSION_CHECK_INVALID_USER',
        resource,
        ipAddress: 'Unknown',
        userAgent: 'Unknown',
        success: false,
        riskLevel: 'HIGH',
        details: { action, resourceId }
      });
      return false;
    }

    // Matrice des permissions
    const permissions = {
      ADMIN: ['*'], // Accès total
      COMMERCIAL: ['READ_CLIENTS', 'WRITE_CLIENTS', 'READ_OPPORTUNITES', 'WRITE_OPPORTUNITES', 'READ_DEVIS', 'WRITE_DEVIS'],
      OUVRIER: ['READ_CHANTIERS', 'WRITE_CHANTIER_PROGRESS', 'READ_PLANNING'],
      CLIENT: ['READ_OWN_DATA', 'READ_OWN_CHANTIERS', 'READ_OWN_DEVIS']
    };

    const userPermissions = permissions[user.role as keyof typeof permissions] || [];
    const hasPermission = userPermissions.includes('*') || userPermissions.includes(action);

    // Log de l'accès
    await logSecurityEvent({
      userId,
      action: 'PERMISSION_CHECK',
      resource,
      ipAddress: 'Unknown',
      userAgent: 'Unknown',
      success: hasPermission,
      riskLevel: hasPermission ? 'LOW' : 'MEDIUM',
      details: { action, userRole: user.role, hasPermission }
    });

    return hasPermission;

  } catch (error) {
    console.error('Erreur vérification permissions:', error);
    return false;
  }
}

/**
 * Détection d'anomalies comportementales
 */
export function detectAnomalies(userId: string, action: string, metadata: any): number {
  const key = userId;
  let riskScore = 0;

  // Initialiser le profil si inexistant
  if (!anomalyDetector.suspiciousActivities.has(key)) {
    anomalyDetector.suspiciousActivities.set(key, { activities: [], score: 0 });
  }

  const profile = anomalyDetector.suspiciousActivities.get(key)!;

  // Détection de patterns suspects
  const suspiciousPatterns = [
    'BULK_DATA_ACCESS', // Accès en masse aux données
    'MULTIPLE_FAILED_LOGINS', // Multiples tentatives de connexion
    'UNUSUAL_TIME_ACCESS', // Accès à des heures inhabituelles
    'PRIVILEGE_ESCALATION', // Tentative d'élévation de privilèges
    'DATA_EXTRACTION' // Extraction de données importantes
  ];

  // Vérifications spécifiques
  if (action.includes('BULK') || action.includes('EXPORT')) {
    riskScore += 30;
    profile.activities.push('BULK_DATA_ACCESS');
  }

  if (metadata?.failedLogins && metadata.failedLogins > 3) {
    riskScore += 50;
    profile.activities.push('MULTIPLE_FAILED_LOGINS');
  }

  const hour = new Date().getHours();
  if (hour < 6 || hour > 22) {
    riskScore += 20;
    profile.activities.push('UNUSUAL_TIME_ACCESS');
  }

  // Mettre à jour le profil
  profile.score = Math.min(profile.score + riskScore, 100);
  profile.activities = profile.activities.slice(-10); // Garder les 10 dernières activités

  return profile.score;
}

/**
 * Chiffrement des données sensibles
 */
export class DataEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const tag = Buffer.from(encryptedData.tag, 'hex');
    const key = crypto.scryptSync(this.KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Chiffrement des données PII (Personal Identifiable Information)
  static encryptPII(data: any): any {
    const sensitiveFields = ['email', 'phone', 'address', 'siret', 'birthDate', 'bankAccount'];
    const result = { ...data };

    for (const field of sensitiveFields) {
      if (result[field]) {
        const encrypted = this.encrypt(result[field].toString());
        result[`${field}_encrypted`] = encrypted;
        delete result[field]; // Supprimer la version non chiffrée
      }
    }

    return result;
  }
}

/**
 * Log des événements de sécurité
 */
export async function logSecurityEvent(event: SecurityLog): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        userId: event.userId || null,
        action: event.action,
        resource: event.resource,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        success: event.success,
        riskLevel: event.riskLevel,
        details: event.details || {},
        timestamp: new Date()
      }
    });

    // Alertes en temps réel pour les événements critiques
    if (event.riskLevel === 'CRITICAL' || event.riskLevel === 'HIGH') {
      console.warn('🚨 ALERTE SÉCURITÉ:', event);
      await sendSecurityAlert(event);
    }

  } catch (error) {
    console.error('Erreur enregistrement log sécurité:', error);
  }
}

/**
 * Envoi d'alertes de sécurité
 */
async function sendSecurityAlert(event: SecurityLog): Promise<void> {
  // En production, envoyer des notifications
  console.log('🚨 Alerte sécurité envoyée:', {
    action: event.action,
    resource: event.resource,
    riskLevel: event.riskLevel,
    timestamp: new Date().toISOString()
  });

  // Ici on pourrait intégrer avec :
  // - Slack/Teams pour notifications
  // - Email pour les admins
  // - Système de monitoring (DataDog, NewRelic, etc.)
}

/**
 * Middleware de sécurité pour les APIs
 */
export async function securityMiddleware(
  request: NextRequest,
  userId?: string,
  action?: string,
  resource?: string
): Promise<{ allowed: boolean; reason?: string }> {
  const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // 1. Rate limiting
  if (!rateLimiter(clientIP)) {
    return { allowed: false, reason: 'Rate limit exceeded' };
  }

  // 2. Vérification des permissions si utilisateur connecté
  if (userId && action && resource) {
    const hasPermission = await checkPermission(userId, action, resource);
    if (!hasPermission) {
      return { allowed: false, reason: 'Insufficient permissions' };
    }
  }

  // 3. Détection d'anomalies
  if (userId) {
    const riskScore = detectAnomalies(userId, action || 'UNKNOWN', { clientIP, userAgent });
    if (riskScore > 70) {
      await logSecurityEvent({
        userId,
        action: 'HIGH_RISK_ACTIVITY_DETECTED',
        resource: resource || 'unknown',
        ipAddress: clientIP,
        userAgent,
        success: false,
        riskLevel: 'HIGH',
        details: { riskScore, action }
      });
      return { allowed: false, reason: 'High risk activity detected' };
    }
  }

  return { allowed: true };
}

/**
 * Validation et sanitisation des entrées
 */
export class InputValidator {
  // Validation SQL injection
  static hasSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(\'|\")(\s)*(OR|AND)/i,
      /(\-\-|\#|\/\*|\*\/)/
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // Validation XSS
  static hasXSS(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<embed\b/gi,
      /<object\b/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // Sanitisation générale
  static sanitize(input: string): string {
    return input
      .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
      .replace(/[<>&"']/g, (char) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '"': '&quot;',
          "'": '&#x27;'
        };
        return entities[char] || char;
      });
  }

  // Validation d'un objet complet
  static validateObject(obj: any, rules: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [key, rule] of Object.entries(rules)) {
      const value = obj[key];
      const ruleConfig = rule as any;

      if (ruleConfig.required && (value === undefined || value === null || value === '')) {
        errors.push(`${key} is required`);
        continue;
      }

      if (value && typeof value === 'string') {
        if (this.hasSqlInjection(value)) {
          errors.push(`${key} contains potential SQL injection`);
        }
        if (this.hasXSS(value)) {
          errors.push(`${key} contains potential XSS`);
        }
        if (ruleConfig.maxLength && value.length > ruleConfig.maxLength) {
          errors.push(`${key} exceeds maximum length of ${ruleConfig.maxLength}`);
        }
        if (ruleConfig.pattern && !ruleConfig.pattern.test(value)) {
          errors.push(`${key} does not match required pattern`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

export default {
  rateLimiter,
  checkPermission,
  detectAnomalies,
  DataEncryption,
  logSecurityEvent,
  securityMiddleware,
  InputValidator
};