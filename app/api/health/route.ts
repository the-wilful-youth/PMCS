import { NextResponse } from 'next/server';
import os from 'os';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const memory = process.memoryUsage();
  const cacheStatus = cache.getStatus();

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      cpus: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      loadAverage: os.loadavg(),
    },
    process: {
      pid: process.pid,
      workerId: process.env.NODE_APP_INSTANCE || process.env.CLUSTER_WORKER_ID || 'standalone',
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
      rssMB: Math.round(memory.rss / (1024 * 1024)),
    },
    cache: cacheStatus,
  };

  return NextResponse.json(healthData, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Check': 'PMCS-OK',
    },
  });
}
