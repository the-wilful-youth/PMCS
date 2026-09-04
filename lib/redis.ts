import Redis from 'ioredis';
import cache from './cache';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redisInstance) return redisInstance;

  const redisUrl = process.env.REDIS_URL || process.env.REDIS_HOST;
  if (!redisUrl && process.env.ENABLE_REDIS !== 'true') {
    return null;
  }

  try {
    redisInstance = redisUrl
      ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 })
      : new Redis({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });

    return redisInstance;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

export { cache };
export default cache;
