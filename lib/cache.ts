import { prisma } from '@/lib/prisma';

/**
 * Système de cache avancé pour ChantierPro
 */
export class AdvancedCache {
  private static instance: AdvancedCache;
  private memoryCache: Map<string, { value: any; expiresAt: number; tags: string[] }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    setInterval(() => this.cleanupMemoryCache(), 60000);
  }

  static getInstance(): AdvancedCache {
    if (!this.instance) {
      this.instance = new AdvancedCache();
    }
    return this.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Cache mémoire
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && Date.now() < memoryEntry.expiresAt) {
        return memoryEntry.value as T;
      }

      // Cache BDD
      const dbEntry = await prisma.cacheEntry.findUnique({
        where: { key }
      });

      if (dbEntry && (!dbEntry.expiresAt || dbEntry.expiresAt > new Date())) {
        this.memoryCache.set(key, {
          value: dbEntry.value,
          expiresAt: dbEntry.expiresAt?.getTime() || Date.now() + this.DEFAULT_TTL,
          tags: Array.isArray(dbEntry.tags) ? (dbEntry.tags as string[]) : []
        });
        return dbEntry.value as T;
      }

      return null;
    } catch (error) {
      console.error(`Cache GET error for ${key}:`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number = this.DEFAULT_TTL, tags: string[] = []): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlMs);

      this.memoryCache.set(key, {
        value,
        expiresAt: expiresAt.getTime(),
        tags
      });

      await prisma.cacheEntry.upsert({
        where: { key },
        create: { key, value: value as any, expiresAt, tags: tags as any },
        update: { value: value as any, expiresAt, tags: tags as any }
      });
    } catch (error) {
      console.error(`Cache SET error for ${key}:`, error);
    }
  }

  async getOrSet<T>(
    key: string,
    generator: () => Promise<T>,
    ttlMs: number = this.DEFAULT_TTL,
    tags: string[] = []
  ): Promise<T> {
    let value = await this.get<T>(key);
    
    if (value === null) {
      value = await generator();
      await this.set(key, value, ttlMs, tags);
    }

    return value;
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export class CacheTags {
  static client(clientId: string) { return [`client:${clientId}`, 'clients']; }
  static chantier(chantierId: string) { return [`chantier:${chantierId}`, 'chantiers']; }
  static devis(devisId: string) { return [`devis:${devisId}`, 'devis']; }
  static opportunite(opportuniteId: string) { return [`opportunite:${opportuniteId}`, 'opportunites']; }
  static analytics(periode: string) { return [`analytics:${periode}`, 'analytics']; }
}

export const cache = AdvancedCache.getInstance();