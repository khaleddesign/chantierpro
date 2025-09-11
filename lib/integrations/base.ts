import { prisma } from '@/lib/prisma';
import { logSecurityEvent } from '@/lib/security';
import { cache } from '@/lib/cache';

/**
 * Interface de base pour toutes les intégrations externes
 */
export interface IntegrationConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  apiSecret?: string;
  baseUrl?: string;
  version?: string;
  rateLimitRequests?: number;
  rateLimitWindow?: number;
  timeout?: number;
  retryAttempts?: number;
  webhookUrl?: string;
  settings?: Record<string, any>;
}

export interface IntegrationResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

export interface IntegrationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestAt: Date | null;
  rateLimitExceeded: number;
}

/**
 * Classe de base pour toutes les intégrations
 */
export abstract class BaseIntegration {
  protected config: IntegrationConfig;
  protected metrics: IntegrationMetrics;
  
  constructor(config: IntegrationConfig) {
    this.config = config;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestAt: null,
      rateLimitExceeded: 0
    };
  }

  /**
   * Test de connectivité avec le service externe
   */
  abstract testConnection(): Promise<IntegrationResponse<boolean>>;

  /**
   * Synchronisation des données
   */
  abstract syncData(options?: any): Promise<IntegrationResponse<any>>;

  /**
   * Méthode HTTP générique avec gestion d'erreurs et métriques
   */
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options?: {
      headers?: Record<string, string>;
      timeout?: number;
      retries?: number;
    }
  ): Promise<IntegrationResponse<T>> {
    const startTime = Date.now();
    
    try {
      // Vérification du rate limiting
      const rateLimitKey = `rate_limit:${this.config.id}`;
      const rateLimitData = await cache.get<{ count: number; resetAt: number }>(rateLimitKey);
      
      if (rateLimitData && rateLimitData.resetAt > Date.now()) {
        if (rateLimitData.count >= (this.config.rateLimitRequests || 100)) {
          this.metrics.rateLimitExceeded++;
          return {
            success: false,
            error: 'Rate limit exceeded',
            statusCode: 429
          };
        }
      }

      // Construction de l'URL complète
      const url = `${this.config.baseUrl}${endpoint}`;
      
      // Headers par défaut
      const defaultHeaders = {
        'Content-Type': 'application/json',
        'User-Agent': 'ChantierPro/1.0',
        ...this.getAuthHeaders(),
        ...options?.headers
      };

      // Configuration de la requête
      const requestOptions: RequestInit = {
        method,
        headers: defaultHeaders,
        signal: AbortSignal.timeout(options?.timeout || this.config.timeout || 10000)
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(data);
      }

      // Exécution de la requête
      const response = await fetch(url, requestOptions);
      const responseTime = Date.now() - startTime;
      
      // Mise à jour des métriques
      this.updateMetrics(true, responseTime);
      
      // Mise à jour du rate limiting
      await this.updateRateLimit();

      // Parsing de la réponse
      let responseData: T | null = null;
      const contentType = response.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType?.includes('text/')) {
        responseData = await response.text() as any;
      }

      // Log de sécurité pour les erreurs
      if (!response.ok) {
        await logSecurityEvent({
          action: 'INTEGRATION_API_ERROR',
          resource: this.config.id,
          ipAddress: 'external',
          userAgent: 'ChantierPro/1.0',
          success: false,
          riskLevel: response.status >= 500 ? 'HIGH' : 'MEDIUM',
          details: {
            integration: this.config.name,
            endpoint,
            method,
            statusCode: response.status,
            error: responseData
          }
        });
      }

      return {
        success: response.ok,
        data: responseData,
        statusCode: response.status,
        rateLimitRemaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        rateLimitReset: response.headers.get('x-ratelimit-reset') 
          ? new Date(parseInt(response.headers.get('x-ratelimit-reset')!) * 1000)
          : undefined
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);

      console.error(`Erreur intégration ${this.config.name}:`, error);

      // Log de sécurité pour les erreurs techniques
      await logSecurityEvent({
        action: 'INTEGRATION_TECHNICAL_ERROR',
        resource: this.config.id,
        ipAddress: 'external',
        userAgent: 'ChantierPro/1.0',
        success: false,
        riskLevel: 'HIGH',
        details: {
          integration: this.config.name,
          endpoint,
          method,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtention des headers d'authentification
   */
  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }
    
    return headers;
  }

  /**
   * Mise à jour des métriques
   */
  private updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestAt = new Date();
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    // Calcul de la moyenne mobile du temps de réponse
    const previousTotal = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1);
    this.metrics.averageResponseTime = (previousTotal + responseTime) / this.metrics.totalRequests;
  }

  /**
   * Mise à jour du rate limiting
   */
  private async updateRateLimit(): Promise<void> {
    const rateLimitKey = `rate_limit:${this.config.id}`;
    const windowMs = (this.config.rateLimitWindow || 3600) * 1000; // Défaut 1 heure
    
    const existing = await cache.get<{ count: number; resetAt: number }>(rateLimitKey);
    const now = Date.now();
    
    if (!existing || existing.resetAt <= now) {
      // Nouvelle fenêtre
      await cache.set(rateLimitKey, {
        count: 1,
        resetAt: now + windowMs
      }, windowMs);
    } else {
      // Incrémenter le compteur existant
      await cache.set(rateLimitKey, {
        count: existing.count + 1,
        resetAt: existing.resetAt
      }, existing.resetAt - now);
    }
  }

  /**
   * Obtention des métriques actuelles
   */
  public getMetrics(): IntegrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Réinitialisation des métriques
   */
  public resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequestAt: null,
      rateLimitExceeded: 0
    };
  }

  /**
   * Vérification de la santé de l'intégration
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    const connectionTest = await this.testConnection();
    const metrics = this.getMetrics();
    
    const successRate = metrics.totalRequests > 0 
      ? metrics.successfulRequests / metrics.totalRequests 
      : 1;
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!connectionTest.success) {
      status = 'unhealthy';
    } else if (successRate < 0.9 || metrics.averageResponseTime > 5000) {
      status = 'degraded';
    }
    
    return {
      status,
      details: {
        connectionTest: connectionTest.success,
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime: Math.round(metrics.averageResponseTime),
        totalRequests: metrics.totalRequests,
        lastRequest: metrics.lastRequestAt?.toISOString()
      }
    };
  }

  /**
   * Configuration de l'intégration
   */
  public updateConfig(newConfig: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Obtention de la configuration (sans les secrets)
   */
  public getConfig(): Omit<IntegrationConfig, 'apiKey' | 'apiSecret'> {
    const { apiKey, apiSecret, ...publicConfig } = this.config;
    return publicConfig;
  }
}

/**
 * Gestionnaire central des intégrations
 */
export class IntegrationManager {
  private static instance: IntegrationManager;
  private integrations: Map<string, BaseIntegration> = new Map();
  
  private constructor() {}
  
  static getInstance(): IntegrationManager {
    if (!this.instance) {
      this.instance = new IntegrationManager();
    }
    return this.instance;
  }
  
  register(integration: BaseIntegration): void {
    this.integrations.set(integration.getConfig().id, integration);
  }
  
  get(id: string): BaseIntegration | undefined {
    return this.integrations.get(id);
  }
  
  getAll(): BaseIntegration[] {
    return Array.from(this.integrations.values());
  }
  
  async healthCheckAll(): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    
    for (const [id, integration] of this.integrations) {
      results[id] = await integration.healthCheck();
    }
    
    return results;
  }
  
  getMetricsAll(): Record<string, IntegrationMetrics> {
    const results: Record<string, IntegrationMetrics> = {};
    
    for (const [id, integration] of this.integrations) {
      results[id] = integration.getMetrics();
    }
    
    return results;
  }
}

export const integrationManager = IntegrationManager.getInstance();