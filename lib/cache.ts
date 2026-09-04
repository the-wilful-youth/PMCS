import Redis from 'ioredis';

export interface CacheStatus {
  backend: 'redis' | 'in-memory';
  connected: boolean;
  hitCount: number;
  missCount: number;
  keyCount: number;
  uptimeSeconds: number;
}

interface InMemoryCacheEntry {
  value: string;
  expiresAt: number;
}

class CacheManager {
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private inMemoryStore = new Map<string, InMemoryCacheEntry>();
  private hitCount = 0;
  private missCount = 0;
  private startTime = Date.now();
  private hasLoggedFallback = false;

  constructor() {
    this.initRedis();
  }

  private initRedis(): void {
    const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;

    // Only attempt Redis connection if explicitly configured or in production with default port
    if (redisUrl || process.env.ENABLE_REDIS === 'true') {
      try {
        const client = redisUrl ? new Redis(redisUrl, {
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy(times) {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 100, 1000);
          },
        }) : new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          lazyConnect: true,
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          retryStrategy(times) {
            if (times > 3) return null;
            return Math.min(times * 100, 1000);
          },
        });

        client.on('connect', () => {
          this.isRedisAvailable = true;
          console.log('✓ Redis connected successfully. Distributed caching active.');
        });

        client.on('error', (err) => {
          this.isRedisAvailable = false;
          if (!this.hasLoggedFallback) {
            console.warn(`⚠ Redis unavailable (${err.message}). Using high-performance in-memory cache fallback.`);
            this.hasLoggedFallback = true;
          }
        });

        // Trigger connection asynchronously
        client.connect().catch(() => {
          this.isRedisAvailable = false;
        });

        this.redisClient = client;
      } catch {
        this.isRedisAvailable = false;
      }
    }
  }

  public async get<T>(key: string): Promise<T | null> {
    const prefixedKey = `pmcs:${key}`;

    if (this.isRedisAvailable && this.redisClient) {
      try {
        const data = await this.redisClient.get(prefixedKey);
        if (data !== null) {
          this.hitCount++;
          return JSON.parse(data) as T;
        }
      } catch {
        // Fall through to in-memory on Redis error
      }
    }

    // In-memory fallback
    const entry = this.inMemoryStore.get(prefixedKey);
    if (!entry) {
      this.missCount++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.inMemoryStore.delete(prefixedKey);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    return JSON.parse(entry.value) as T;
  }

  public async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const prefixedKey = `pmcs:${key}`;
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.set(prefixedKey, serialized, 'EX', ttlSeconds);
      } catch {
        // Fall back to in-memory
      }
    }

    this.inMemoryStore.set(prefixedKey, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  public async del(key: string): Promise<void> {
    const prefixedKey = `pmcs:${key}`;

    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.del(prefixedKey);
      } catch {
        // Fall back
      }
    }

    this.inMemoryStore.delete(prefixedKey);
  }

  public async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlSeconds: number = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const freshValue = await fetcher();
    await this.set(key, freshValue, ttlSeconds);
    return freshValue;
  }

  public getStatus(): CacheStatus {
    this.cleanExpiredInMemory();
    return {
      backend: this.isRedisAvailable ? 'redis' : 'in-memory',
      connected: this.isRedisAvailable,
      hitCount: this.hitCount,
      missCount: this.missCount,
      keyCount: this.isRedisAvailable ? -1 : this.inMemoryStore.size,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  private cleanExpiredInMemory(): void {
    const now = Date.now();
    for (const [key, entry] of this.inMemoryStore.entries()) {
      if (now > entry.expiresAt) {
        this.inMemoryStore.delete(key);
      }
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();
export default cache;
