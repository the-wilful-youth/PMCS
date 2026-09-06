import { NextRequest, NextResponse } from 'next/server';
import { db, Issue } from '@/lib/db';
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
  let issues = [...dbData.issues];

  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    issues = issues.filter((i) => i.projectId === projectId);
  } else {
    const accessible = getUserAccessibleProjectIds(user, dbData);
    issues = issues.filter((i) => i.projectId && accessible.includes(i.projectId));
  }

  return NextResponse.json({ issues });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const {
      title,
      description,
      severity = 'Medium',
      status = 'Open',
      priority = 'Medium',
      assignedTo,
      relatedTask,
      resolution,
      projectId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
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
      return forbiddenResponse('Forbidden: You do not have permission to report issues for this project');
    }

    const nextNum = dbData.issues.length + 1;
    const id = `ISS-${String(nextNum).padStart(3, '0')}`;

    const newIssue: Issue = {
      id,
      title: title.trim(),
      description: description?.trim() || '',
      projectId: targetProjectId,
      severity,
      status,
      priority,
      reportedBy: user.name || user.username,
      assignedTo: assignedTo || user.name || user.username,
      relatedTask: relatedTask || undefined,
      resolution: resolution || undefined,
      reportedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.issues.unshift(newIssue);
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'issue_reported',
      `Reported issue ${id}: ${newIssue.title} (${newIssue.severity} severity)`,
      'issue',
      id,
      targetProjectId
    );

    return NextResponse.json({ issue: newIssue }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create issue' }, { status: 500 });
  }
}
