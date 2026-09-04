import { NextResponse } from 'next/server';
import { cache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cacheKey = 'dashboard:metrics';

  // High-performance Redis caching layer with 60s TTL
  const metrics = await cache.getOrSet(
    cacheKey,
    async () => {
      // Simulated database aggregation query under load
      return {
        overallCompletion: 35,
        totalTasks: 5,
        completedTasks: 1,
        inProgressTasks: 2,
        blockedTasks: 0,
        readyForReview: 0,
        overdueTasks: 0,
        dueIn7Days: 2,
        healthStatus: 'ON TRACK',
        teamMembersCount: 4,
        researchPapersCount: 4,
        datasetsCount: 4,
        activeMilestonesCount: 5,
        lastCalculated: new Date().toISOString(),
      };
    },
    60 // 60 seconds TTL
  );

  return NextResponse.json(metrics, {
    status: 200,
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      'X-Cache-Backend': cache.getStatus().backend,
    },
  });
}
