import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { cache } from '@/lib/cache';
import {
  getSessionUser,
  unauthorizedResponse,
  getUserAccessibleProjectIds,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const requestedProjectId = searchParams.get('projectId');
  const dbData = db.read();

  const accessibleIds = getUserAccessibleProjectIds(user, dbData);
  const targetId =
    requestedProjectId && accessibleIds.includes(requestedProjectId)
      ? requestedProjectId
      : accessibleIds.length === 1
      ? accessibleIds[0]
      : 'all';

  const cacheKey = `dashboard:metrics:${user.id}:${targetId}`;

  const metrics = await cache.getOrSet(
    cacheKey,
    async () => {
      return db.getDashboardMetrics(targetId === 'all' ? undefined : targetId);
    },
    30
  );

  return NextResponse.json(metrics, {
    status: 200,
    headers: {
      'Cache-Control': 'private, no-cache',
      'X-Cache-Backend': cache.getStatus().backend,
    },
  });
}
