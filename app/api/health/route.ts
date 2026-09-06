import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { cache } from '@/lib/cache';
import { getAuthenticatedUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  const uptimeSeconds = Math.floor(process.uptime());

  // Base safe response for public load balancers and orchestrators
  const baseHealth = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
  };

  // Restrict detailed system reconnaissance to authenticated administrators
  if (!user || user.role !== 'admin') {
    return NextResponse.json(baseHealth, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-Health-Check': 'PMCS-OK',
      },
    });
  }

  const memory = process.memoryUsage();
  const cacheStatus = cache.getStatus();

  const diagnosticHealth = {
    ...baseHealth,
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
      totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      loadAverage: os.loadavg(),
    },
    process: {
      pid: process.pid,
      heapUsedMB: Math.round(memory.heapUsed / (1024 * 1024)),
      heapTotalMB: Math.round(memory.heapTotal / (1024 * 1024)),
      rssMB: Math.round(memory.rss / (1024 * 1024)),
    },
    cache: cacheStatus,
  };

  return NextResponse.json(diagnosticHealth, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'X-Health-Check': 'PMCS-OK',
    },
  });
}

