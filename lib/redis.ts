import Redis from 'ioredis';

// Client Redis avec gestion d'erreur et fallback
class RedisClient {
  private client: Redis | null = null;
  private isConnected = false;
  private fallbackStore = new Map<string, { value: string; expiresAt: number }>();

  constructor() {
    this.initializeClient();
  }

  private async initializeClient() {
    try {
      // Skip Redis initialization if REDIS_URL is not set
      if (!process.env.REDIS_URL) {
        console.log('Redis disabled - using memory fallback');
        return;
      }
      
      const redisUrl = process.env.REDIS_URL;
      
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        connectTimeout: 5000,
        commandTimeout: 5000,
        lazyConnect: true
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        console.warn('Redis connection error, falling back to memory:', error.message);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.warn('Redis connection closed, using memory fallback');
        this.isConnected = false;
      });

      // Test la connexion
      await this.client.ping();
      this.isConnected = true;

    } catch (error) {
      console.warn('Redis not available, using memory fallback:', error);
      this.isConnected = false;
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (error) {
        console.warn('Redis GET error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    this.cleanupExpiredKeys();
    const entry = this.fallbackStore.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    return null;
  }

  async set(key: string, value: string, expirationInSeconds?: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        if (expirationInSeconds) {
          await this.client.setex(key, expirationInSeconds, value);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (error) {
        console.warn('Redis SET error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    const expiresAt = expirationInSeconds 
      ? Date.now() + (expirationInSeconds * 1000)
      : Date.now() + (24 * 60 * 60 * 1000); // 24h par défaut

    this.fallbackStore.set(key, { value, expiresAt });
    this.cleanupExpiredKeys();
  }

  async setex(key: string, seconds: number, value: string): Promise<void> {
    return this.set(key, value, seconds);
  }

  async incr(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.incr(key);
      } catch (error) {
        console.warn('Redis INCR error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    const current = await this.get(key);
    const newValue = (current ? parseInt(current) : 0) + 1;
    await this.set(key, newValue.toString());
    return newValue;
  }

  async ttl(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.ttl(key);
      } catch (error) {
        console.warn('Redis TTL error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    const entry = this.fallbackStore.get(key);
    if (entry) {
      const remaining = Math.max(0, entry.expiresAt - Date.now());
      return Math.ceil(remaining / 1000);
    }
    return -1;
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (error) {
        console.warn('Redis DEL error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    this.fallbackStore.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.keys(pattern);
      } catch (error) {
        console.warn('Redis KEYS error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire - simulation basique des patterns
    const keys = Array.from(this.fallbackStore.keys());
    if (pattern === '*') {
      return keys;
    }
    
    // Support basique pour le pattern * à la fin
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return keys.filter(key => key.startsWith(prefix));
    }
    
    return keys.filter(key => key === pattern);
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.hget(key, field);
      } catch (error) {
        console.warn('Redis HGET error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire - stocker les hash comme JSON
    const hashData = await this.get(key);
    if (hashData) {
      try {
        const hash = JSON.parse(hashData);
        return hash[field] || null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async hset(key: string, data: Record<string, string>): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.hset(key, data);
        return;
      } catch (error) {
        console.warn('Redis HSET error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire - stocker comme JSON
    await this.set(key, JSON.stringify(data));
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.hincrby(key, field, increment);
      } catch (error) {
        console.warn('Redis HINCRBY error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    const hashData = await this.get(key);
    let hash: Record<string, string> = {};
    
    if (hashData) {
      try {
        hash = JSON.parse(hashData);
      } catch {
        hash = {};
      }
    }

    const currentValue = parseInt(hash[field] || '0', 10);
    const newValue = currentValue + increment;
    hash[field] = newValue.toString();
    
    await this.set(key, JSON.stringify(hash));
    return newValue;
  }

  async hgetall(key: string): Promise<Record<string, string> | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.hgetall(key);
      } catch (error) {
        console.warn('Redis HGETALL error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire
    const hashData = await this.get(key);
    if (hashData) {
      try {
        return JSON.parse(hashData);
      } catch {
        return null;
      }
    }
    return null;
  }

  async pttl(key: string): Promise<number> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.pttl(key);
      } catch (error) {
        console.warn('Redis PTTL error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire - retourner TTL en millisecondes
    const ttlSeconds = await this.ttl(key);
    return ttlSeconds > 0 ? ttlSeconds * 1000 : ttlSeconds;
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.expire(key, seconds);
        return;
      } catch (error) {
        console.warn('Redis EXPIRE error, using fallback:', error);
        this.isConnected = false;
      }
    }

    // Fallback en mémoire - mettre à jour l'expiration
    const entry = this.fallbackStore.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + (seconds * 1000);
      this.fallbackStore.set(key, entry);
    }
  }

  pipeline() {
    if (this.isConnected && this.client) {
      return this.client.pipeline();
    }

    // Fallback pipeline simulé
    return {
      hgetall: (key: string) => ({ key, command: 'hgetall' }),
      pttl: (key: string) => ({ key, command: 'pttl' }),
      hset: (key: string, data: Record<string, string>) => ({ key, command: 'hset', data }),
      expire: (key: string, seconds: number) => ({ key, command: 'expire', seconds }),
      exec: async () => {
        // Simulation basique - retourner des résultats vides
        return [[null, {}], [null, -1]];
      }
    };
  }

  private cleanupExpiredKeys() {
    const now = Date.now();
    for (const [key, entry] of this.fallbackStore.entries()) {
      if (entry.expiresAt <= now) {
        this.fallbackStore.delete(key);
      }
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      usingFallback: !this.isConnected,
      fallbackKeys: this.fallbackStore.size
    };
  }
}

// Instance globale
const redisClient = new RedisClient();

export default redisClient;