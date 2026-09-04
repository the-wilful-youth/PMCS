import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const actionType = searchParams.get('actionType');
  const entityType = searchParams.get('entityType');

  const dbData = db.read();
  let activities = [...dbData.activity];

  if (actionType && actionType !== 'all') {
    activities = activities.filter(a => a.actionType.toLowerCase() === actionType.toLowerCase());
  }

  if (entityType && entityType !== 'all') {
    activities = activities.filter(a => a.entityType.toLowerCase() === entityType.toLowerCase());
  }

  return NextResponse.json({ activity: activities });
}
