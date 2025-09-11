import { cache } from './redis-cache';
import { CacheOptions } from './redis-cache';

// TTL par type de donnée (en secondes)
const CACHE_TTL = {
  USER_SESSION: 3600, // 1 heure
  USER_PROFILE: 1800, // 30 minutes
  CHANTIERS_LIST: 300, // 5 minutes
  CHANTIER_DETAIL: 600, // 10 minutes
  DEVIS_LIST: 300, // 5 minutes
  DEVIS_DETAIL: 900, // 15 minutes
  MESSAGES_LIST: 60, // 1 minute
  PLANNING_DATA: 300, // 5 minutes
  DOCUMENTS_LIST: 600, // 10 minutes
  CRM_OPPORTUNITIES: 300, // 5 minutes
  STATS_DASHBOARD: 180, // 3 minutes
  SEARCH_RESULTS: 300, // 5 minutes
  NOTIFICATIONS: 120, // 2 minutes
  UPLOAD_PROGRESS: 300, // 5 minutes
} as const;

// Tags pour l'invalidation groupée
const CACHE_TAGS = {
  USER: 'user',
  CHANTIER: 'chantier',
  DEVIS: 'devis',
  MESSAGE: 'message',
  PLANNING: 'planning',
  DOCUMENT: 'document',
  CRM: 'crm',
  NOTIFICATION: 'notification',
  STATS: 'stats',
} as const;

export class ApplicationCache {
  // Cache utilisateur
  async getUserProfile(userId: string) {
    return cache.getWithFallback(
      `user:profile:${userId}`,
      async () => {
        // Cette fonction sera remplacée par l'appel API réel
        return null;
      },
      {
        ttl: CACHE_TTL.USER_PROFILE,
        tags: [CACHE_TAGS.USER],
        namespace: 'users'
      }
    );
  }

  async setUserProfile(userId: string, profile: any) {
    return cache.set(
      `user:profile:${userId}`,
      profile,
      {
        ttl: CACHE_TTL.USER_PROFILE,
        tags: [CACHE_TAGS.USER],
        namespace: 'users'
      }
    );
  }

  // Cache chantiers
  async getChantiersList(userId: string, filters?: any) {
    const filterKey = filters ? `:${Buffer.from(JSON.stringify(filters)).toString('base64')}` : '';
    return cache.get(
      `chantiers:list:${userId}${filterKey}`,
      {
        namespace: 'chantiers',
        ttl: CACHE_TTL.CHANTIERS_LIST
      }
    );
  }

  async setChantiersListCache(userId: string, chantiers: any[], filters?: any) {
    const filterKey = filters ? `:${Buffer.from(JSON.stringify(filters)).toString('base64')}` : '';
    return cache.set(
      `chantiers:list:${userId}${filterKey}`,
      chantiers,
      {
        namespace: 'chantiers',
        ttl: CACHE_TTL.CHANTIERS_LIST,
        tags: [CACHE_TAGS.CHANTIER]
      }
    );
  }

  async getChantierDetail(chantierId: string) {
    return cache.get(
      `chantier:detail:${chantierId}`,
      {
        namespace: 'chantiers',
        ttl: CACHE_TTL.CHANTIER_DETAIL
      }
    );
  }

  async setChantierDetailCache(chantierId: string, chantier: any) {
    return cache.set(
      `chantier:detail:${chantierId}`,
      chantier,
      {
        namespace: 'chantiers',
        ttl: CACHE_TTL.CHANTIER_DETAIL,
        tags: [CACHE_TAGS.CHANTIER]
      }
    );
  }

  // Cache devis
  async getDevisList(userId: string, filters?: any) {
    const filterKey = filters ? `:${Buffer.from(JSON.stringify(filters)).toString('base64')}` : '';
    return cache.get(
      `devis:list:${userId}${filterKey}`,
      {
        namespace: 'devis',
        ttl: CACHE_TTL.DEVIS_LIST
      }
    );
  }

  async setDevisListCache(userId: string, devis: any[], filters?: any) {
    const filterKey = filters ? `:${Buffer.from(JSON.stringify(filters)).toString('base64')}` : '';
    return cache.set(
      `devis:list:${userId}${filterKey}`,
      devis,
      {
        namespace: 'devis',
        ttl: CACHE_TTL.DEVIS_LIST,
        tags: [CACHE_TAGS.DEVIS]
      }
    );
  }

  // Cache messages
  async getMessagesList(chantierId: string, page = 1) {
    return cache.get(
      `messages:list:${chantierId}:page:${page}`,
      {
        namespace: 'messages',
        ttl: CACHE_TTL.MESSAGES_LIST
      }
    );
  }

  async setMessagesListCache(chantierId: string, messages: any[], page = 1) {
    return cache.set(
      `messages:list:${chantierId}:page:${page}`,
      messages,
      {
        namespace: 'messages',
        ttl: CACHE_TTL.MESSAGES_LIST,
        tags: [CACHE_TAGS.MESSAGE]
      }
    );
  }

  // Cache planning
  async getPlanningData(userId: string, dateRange: { start: string; end: string }) {
    const rangeKey = `${dateRange.start}:${dateRange.end}`;
    return cache.get(
      `planning:${userId}:${rangeKey}`,
      {
        namespace: 'planning',
        ttl: CACHE_TTL.PLANNING_DATA
      }
    );
  }

  async setPlanningDataCache(userId: string, dateRange: { start: string; end: string }, data: any) {
    const rangeKey = `${dateRange.start}:${dateRange.end}`;
    return cache.set(
      `planning:${userId}:${rangeKey}`,
      data,
      {
        namespace: 'planning',
        ttl: CACHE_TTL.PLANNING_DATA,
        tags: [CACHE_TAGS.PLANNING]
      }
    );
  }

  // Cache statistiques dashboard
  async getDashboardStats(userId: string) {
    return cache.get(
      `stats:dashboard:${userId}`,
      {
        namespace: 'stats',
        ttl: CACHE_TTL.STATS_DASHBOARD
      }
    );
  }

  async setDashboardStatsCache(userId: string, stats: any) {
    return cache.set(
      `stats:dashboard:${userId}`,
      stats,
      {
        namespace: 'stats',
        ttl: CACHE_TTL.STATS_DASHBOARD,
        tags: [CACHE_TAGS.STATS]
      }
    );
  }

  // Cache recherche
  async getSearchResults(query: string, userId: string, type?: string) {
    const searchKey = `search:${Buffer.from(query).toString('base64')}:${userId}${type ? `:${type}` : ''}`;
    return cache.get(
      searchKey,
      {
        namespace: 'search',
        ttl: CACHE_TTL.SEARCH_RESULTS
      }
    );
  }

  async setSearchResultsCache(query: string, userId: string, results: any[], type?: string) {
    const searchKey = `search:${Buffer.from(query).toString('base64')}:${userId}${type ? `:${type}` : ''}`;
    return cache.set(
      searchKey,
      results,
      {
        namespace: 'search',
        ttl: CACHE_TTL.SEARCH_RESULTS
      }
    );
  }

  // Cache documents
  async getDocumentsList(chantierId: string, folder?: string) {
    const folderKey = folder ? `:folder:${folder}` : '';
    return cache.get(
      `documents:list:${chantierId}${folderKey}`,
      {
        namespace: 'documents',
        ttl: CACHE_TTL.DOCUMENTS_LIST
      }
    );
  }

  async setDocumentsListCache(chantierId: string, documents: any[], folder?: string) {
    const folderKey = folder ? `:folder:${folder}` : '';
    return cache.set(
      `documents:list:${chantierId}${folderKey}`,
      documents,
      {
        namespace: 'documents',
        ttl: CACHE_TTL.DOCUMENTS_LIST,
        tags: [CACHE_TAGS.DOCUMENT]
      }
    );
  }

  // Cache CRM
  async getCRMOpportunities(clientId: string) {
    return cache.get(
      `crm:opportunities:${clientId}`,
      {
        namespace: 'crm',
        ttl: CACHE_TTL.CRM_OPPORTUNITIES
      }
    );
  }

  async setCRMOpportunitiesCache(clientId: string, opportunities: any[]) {
    return cache.set(
      `crm:opportunities:${clientId}`,
      opportunities,
      {
        namespace: 'crm',
        ttl: CACHE_TTL.CRM_OPPORTUNITIES,
        tags: [CACHE_TAGS.CRM]
      }
    );
  }

  // Cache notifications
  async getNotifications(userId: string) {
    return cache.get(
      `notifications:${userId}`,
      {
        namespace: 'notifications',
        ttl: CACHE_TTL.NOTIFICATIONS
      }
    );
  }

  async setNotificationsCache(userId: string, notifications: any[]) {
    return cache.set(
      `notifications:${userId}`,
      notifications,
      {
        namespace: 'notifications',
        ttl: CACHE_TTL.NOTIFICATIONS,
        tags: [CACHE_TAGS.NOTIFICATION]
      }
    );
  }

  // Invalidation ciblée
  async invalidateUserCache(userId: string) {
    await Promise.all([
      cache.invalidateByPattern(`users:user:*:${userId}*`),
      cache.invalidateByPattern(`chantiers:chantiers:list:${userId}*`),
      cache.invalidateByPattern(`devis:devis:list:${userId}*`),
      cache.invalidateByPattern(`stats:stats:dashboard:${userId}`),
      cache.invalidateByPattern(`notifications:notifications:${userId}`),
    ]);
  }

  async invalidateChantierCache(chantierId: string) {
    await Promise.all([
      cache.invalidateByPattern(`chantiers:chantier:detail:${chantierId}`),
      cache.invalidateByPattern(`messages:messages:list:${chantierId}*`),
      cache.invalidateByPattern(`documents:documents:list:${chantierId}*`),
      cache.invalidateByTag(CACHE_TAGS.CHANTIER),
    ]);
  }

  async invalidateDevisCache(devisId?: string) {
    if (devisId) {
      await cache.invalidateByPattern(`devis:devis:detail:${devisId}`);
    }
    await cache.invalidateByTag(CACHE_TAGS.DEVIS);
  }

  async invalidateMessagesCache(chantierId: string) {
    await cache.invalidateByPattern(`messages:messages:list:${chantierId}*`);
  }

  async invalidatePlanningCache(userId?: string) {
    if (userId) {
      await cache.invalidateByPattern(`planning:planning:${userId}*`);
    } else {
      await cache.invalidateByTag(CACHE_TAGS.PLANNING);
    }
  }

  // Méthodes de maintenance
  async warmUpCache() {
    // Cette méthode peut être appelée pour pré-charger le cache avec les données fréquemment utilisées
    console.log('Cache warm-up started...');
    // Implémentation du warm-up
  }

  async clearAllCache() {
    await cache.flush();
  }

  async getCacheStats() {
    return cache.getStats();
  }
}

// Instance singleton
export const appCache = new ApplicationCache();