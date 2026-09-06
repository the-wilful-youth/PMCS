import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  canUserAccessProject,
  getUserAccessibleProjectIds,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const actionType = searchParams.get('actionType');
  const entityType = searchParams.get('entityType');
  const projectId = searchParams.get('projectId');

  const dbData = db.read();
  let activities = [...dbData.activity];

  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    activities = activities.filter((a) => a.projectId === projectId);
  } else {
    const accessible = getUserAccessibleProjectIds(user, dbData);
    activities = activities.filter((a) => a.projectId && accessible.includes(a.projectId));
  }

  if (actionType && actionType !== 'all') {
    activities = activities.filter((a) => a.actionType.toLowerCase() === actionType.toLowerCase());
  }

  if (entityType && entityType !== 'all') {
    activities = activities.filter((a) => a.entityType.toLowerCase() === entityType.toLowerCase());
  }

  return NextResponse.json({ activity: activities });
}
