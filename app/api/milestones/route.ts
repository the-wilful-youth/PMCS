import { NextRequest, NextResponse } from 'next/server';
import { db, Milestone } from '@/lib/db';
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
  const projectId = searchParams.get('projectId');
  const dbData = db.read();
  let milestones = [...dbData.milestones];

  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    milestones = milestones.filter((m) => m.projectId === projectId);
  } else {
    const accessible = getUserAccessibleProjectIds(user, dbData);
    milestones = milestones.filter((m) => m.projectId && accessible.includes(m.projectId));
  }

  return NextResponse.json({ milestones });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const {
      name,
      description,
      owner,
      targetDate,
      status = 'Not Started',
      successCriteria = [],
      relatedTasks = [],
      notes = '',
      projectId,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Milestone name is required' }, { status: 400 });
    }

    const dbData = db.read();
    let targetProjectId = projectId?.trim();
    if (!targetProjectId) {
      const accessible = getUserAccessibleProjectIds(user, dbData);
      if (accessible.length > 0) {
        targetProjectId = accessible[0];
      } else {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
      }
    }

    if (!canUserAccessProject(user, targetProjectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have permission to add milestones to this project');
    }

    const nextNum = dbData.milestones.length + 1;
    const id = `MS-${String(nextNum).padStart(3, '0')}`;

    const newMilestone: Milestone = {
      id,
      name: name.trim(),
      description: description?.trim() || '',
      projectId: targetProjectId,
      owner: owner || user.name || user.username,
      targetDate: targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status,
      successCriteria: Array.isArray(successCriteria) ? successCriteria : [successCriteria].filter(Boolean),
      relatedTasks: Array.isArray(relatedTasks) ? relatedTasks : [relatedTasks].filter(Boolean),
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.milestones.push(newMilestone);
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'milestone_created',
      `Created milestone ${id}: ${newMilestone.name}`,
      'milestone',
      id,
      targetProjectId
    );

    return NextResponse.json({ milestone: newMilestone }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create milestone' }, { status: 500 });
  }
}
