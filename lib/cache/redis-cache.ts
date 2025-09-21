// TEMPORARY: Simplified cache for stabilization
export interface CacheOptions {
  ttl?: number; // Time to live en secondes
  namespace?: string;
  tags?: string[];
  strategy?: 'cache-first' | 'network-first' | 'stale-while-revalidate';
}

export class RedisCache {
  private defaultTTL = 3600; // 1 heure par défaut
  private defaultNamespace = 'chantierpro';
  private memoryCache = new Map<string, { value: any; expiry: number }>();

  constructor(private client: any = null) {}

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.defaultNamespace;
    return `${ns}:${key}`;
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.buildKey(key, options.namespace);
      const cached = await this.client.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, options.namespace);
      const ttl = options.ttl || this.defaultTTL;
      const serialized = JSON.stringify(value);
      
      await this.client.setex(cacheKey, ttl, serialized);
      
      // Gérer les tags pour l'invalidation groupée
      if (options.tags?.length) {
        await this.addToTags(cacheKey, options.tags);
      }
      
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async del(key: string, namespace?: string): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, namespace);
      await this.client.del(cacheKey);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const tagKey = `tags:${tag}`;
      const keys = await this.client.smembers(tagKey);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        await this.client.del(tagKey);
      }
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Cache pattern invalidation error:', error);
    }
  }

  private async addToTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = `tags:${tag}`;
      await this.client.sadd(tagKey, key);
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, options);
    
    return data;
  }

  async refresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }

  async getWithFallback<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const strategy = options.strategy || 'cache-first';

    switch (strategy) {
      case 'cache-first':
        return this.getOrSet(key, fetcher, options);

      case 'network-first':
        try {
          return await this.refresh(key, fetcher, options);
        } catch {
          return (await this.get<T>(key, options)) || await fetcher();
        }

      case 'stale-while-revalidate':
        const cached = await this.get<T>(key, options);
        
        if (cached) {
          // Revalider en arrière-plan
          this.refresh(key, fetcher, options).catch(console.error);
          return cached;
        }
        
        return this.getOrSet(key, fetcher, options);

      default:
        return this.getOrSet(key, fetcher, options);
    }
  }

  async mget<T>(keys: string[], namespace?: string): Promise<(T | null)[]> {
    try {
      const cacheKeys = keys.map(key => this.buildKey(key, namespace));
      const results = await this.client.mget(...cacheKeys);
      
      return results.map((result: string | null) => 
        result ? JSON.parse(result) : null
      );
    } catch (error) {
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    }
  }

  async mset<T>(
    entries: Array<{ key: string; value: T }>,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const ttl = options.ttl || this.defaultTTL;
      const pipeline = this.client.pipeline();
      
      for (const { key, value } of entries) {
        const cacheKey = this.buildKey(key, options.namespace);
        pipeline.setex(cacheKey, ttl, JSON.stringify(value));
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  async exists(key: string, namespace?: string): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, namespace);
      const result = await this.client.exists(cacheKey);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  async ttl(key: string, namespace?: string): Promise<number> {
    try {
      const cacheKey = this.buildKey(key, namespace);
      return await this.client.ttl(cacheKey);
    } catch (error) {
      console.error('Cache TTL error:', error);
      return -1;
    }
  }

  async expire(key: string, ttl: number, namespace?: string): Promise<boolean> {
    try {
      const cacheKey = this.buildKey(key, namespace);
      await this.client.expire(cacheKey, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  async flush(namespace?: string): Promise<boolean> {
    try {
      const pattern = namespace ? `${namespace}:*` : `${this.defaultNamespace}:*`;
      await this.invalidateByPattern(pattern);
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }

  async getStats(): Promise<{
    hits: number;
    misses: number;
    totalKeys: number;
    memory: string;
  }> {
    try {
      const info = await this.client.info('stats');
      const memory = await this.client.info('memory');
      
      const hits = this.extractValue(info, 'keyspace_hits') || 0;
      const misses = this.extractValue(info, 'keyspace_misses') || 0;
      const totalKeys = await this.client.dbsize();
      const usedMemory = this.extractValue(memory, 'used_memory_human') || '0B';
      
      return {
        hits: parseInt(hits.toString()),
        misses: parseInt(misses.toString()),
        totalKeys,
        memory: usedMemory.toString()
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return { hits: 0, misses: 0, totalKeys: 0, memory: '0B' };
    }
  }

  private extractValue(info: string, key: string): string | number | null {
    const match = info.match(new RegExp(`${key}:(.+)`));
    return match ? match[1].trim() : null;
  }
}

// Instance singleton
export const cache = new RedisCache();