import { cache } from '@/lib/cache';

describe('High-Performance Cache & Redis Manager', () => {
  beforeEach(async () => {
    await cache.del('test_key');
    await cache.del('metric_key');
  });

  test('sets and retrieves cached values with correct typing', async () => {
    await cache.set('test_key', { count: 42, label: 'PMCS' }, 60);
    const result = await cache.get<{ count: number; label: string }>('test_key');

    expect(result).not.toBeNull();
    expect(result?.count).toBe(42);
    expect(result?.label).toBe('PMCS');
  });

  test('returns null for non-existent or expired keys', async () => {
    const missing = await cache.get('non_existent_key');
    expect(missing).toBeNull();
  });

  test('deletes cached keys cleanly', async () => {
    await cache.set('test_key', 'temporary', 60);
    await cache.del('test_key');
    const result = await cache.get('test_key');
    expect(result).toBeNull();
  });

  test('getOrSet executes fetcher once and returns cached value on subsequent calls', async () => {
    const fetcher = jest.fn().mockResolvedValue({ totalTasks: 10 });

    // Call 1: should execute fetcher
    const firstCall = await cache.getOrSet('metric_key', fetcher, 60);
    expect(firstCall).toEqual({ totalTasks: 10 });
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Call 2: should return cached value without executing fetcher
    const secondCall = await cache.getOrSet('metric_key', fetcher, 60);
    expect(secondCall).toEqual({ totalTasks: 10 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test('reports cache status including backend, hits, and uptime', () => {
    const status = cache.getStatus();
    expect(status).toHaveProperty('backend');
    expect(status).toHaveProperty('connected');
    expect(status).toHaveProperty('hitCount');
    expect(status).toHaveProperty('missCount');
    expect(status.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
