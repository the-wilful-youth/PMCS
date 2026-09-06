import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  canUserAccessProject,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const issue = dbData.issues.find((i) => i.id === id);

  if (!issue) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  if (issue.projectId && !canUserAccessProject(user, issue.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have access to this issue');
  }

  return NextResponse.json({ issue });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.issues.findIndex((i) => i.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  const issue = dbData.issues[index];
  if (issue.projectId && !canUserAccessProject(user, issue.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to modify this issue');
  }

  try {
    const body = await request.json();
    if (body.title) issue.title = String(body.title).trim();
    if (body.description !== undefined) issue.description = String(body.description).trim();
    if (body.severity) issue.severity = body.severity;
    if (body.priority) issue.priority = body.priority;
    if (body.assignedTo) issue.assignedTo = body.assignedTo;
    if (body.relatedTask !== undefined) issue.relatedTask = body.relatedTask;
    if (body.resolution !== undefined) issue.resolution = String(body.resolution).trim();

    if (body.status && body.status !== issue.status) {
      issue.status = body.status;
      if (body.status === 'Resolved' || body.status === 'Closed') {
        issue.resolvedDate = new Date().toISOString().split('T')[0];
      }
      db.logActivity(
        user.id || 'u-unknown',
        user.name || user.username,
        'issue_status_changed',
        `Changed issue ${issue.id} status to ${body.status}`,
        'issue',
        issue.id,
        issue.projectId
      );
    }

    issue.updatedAt = new Date().toISOString();
    dbData.issues[index] = issue;
    db.write(dbData);

    return NextResponse.json({ issue });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update issue' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.issues.findIndex((i) => i.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
  }

  const issue = dbData.issues[index];
  if (issue.projectId && !canUserAccessProject(user, issue.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to delete this issue');
  }

  const removed = dbData.issues.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(
    user.id || 'u-unknown',
    user.name || user.username,
    'issue_deleted',
    `Deleted issue ${id}: ${removed.title}`,
    'issue',
    id,
    issue.projectId
  );

  return NextResponse.json({ success: true, message: `Issue ${id} deleted` });
}
