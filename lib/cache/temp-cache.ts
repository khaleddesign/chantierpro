// TEMPORARY: Simple memory cache for stabilization
export interface CacheOptions {
  ttl?: number;
  namespace?: string;
  tags?: string[];
  strategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

export class RedisCache {
  private defaultTTL = 3600;
  private defaultNamespace = 'chantierpro';
  private memoryCache = new Map<string, { value: any; expiry: number }>();

  constructor(private client: any = null) {}

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.defaultNamespace;
    return `${ns}:${key}`;
  }

  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key, options?.namespace);
      const cached = this.memoryCache.get(fullKey);

      if (!cached || Date.now() > cached.expiry) {
        this.memoryCache.delete(fullKey);
        return null;
      }

      return cached.value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.namespace);
      const ttl = options?.ttl || this.defaultTTL;
      const expiry = Date.now() + (ttl * 1000);

      this.memoryCache.set(fullKey, { value, expiry });
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string, options?: CacheOptions): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key, options?.namespace);
      return this.memoryCache.delete(fullKey);
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      this.memoryCache.clear();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    // Simple implementation - clear all for stabilization
    this.memoryCache.clear();
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    totalKeys: number;
    memory: string;
  }> {
    return {
      hits: 0,
      misses: 0,
      totalKeys: this.memoryCache.size,
      memory: `${this.memoryCache.size * 100}B` // Rough estimate
    };
  }

  async ping(): Promise<boolean> {
    return true;
  }
}

export const cache = new RedisCache();

// Export des membres manquants
export const useCacheStats = () => {
  return {
    hits: 0,
    misses: 0,
    totalKeys: cache['memoryCache'].size,
    memory: `${cache['memoryCache'].size * 100}B`
  };
};

export const CacheManager = {
  getStats: () => cache.getStats(),
  clear: () => cache['memoryCache'].clear(),
  invalidate: (pattern: string) => {
    const keys = Array.from(cache['memoryCache'].keys()).filter(key => key.includes(pattern));
    keys.forEach(key => cache['memoryCache'].delete(key));
  }
};