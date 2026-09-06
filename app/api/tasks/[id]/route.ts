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
  const task = dbData.tasks.find((t) => t.id === id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (!canUserAccessProject(user, task.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have access to this task');
  }

  return NextResponse.json({ task });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const taskIndex = dbData.tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = dbData.tasks[taskIndex];
  if (!canUserAccessProject(user, task.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to modify this task');
  }

  try {
    const body = await request.json();

    // Handling comment addition
    if (body.addComment) {
      const newComment = {
        id: `c-${Date.now()}`,
        userId: user.id || 'u-unknown',
        userName: user.name || user.username,
        content: String(body.addComment).trim(),
        createdAt: new Date().toISOString(),
      };
      task.comments.push(newComment);
      db.logActivity(
        user.id || 'u-unknown',
        user.name || user.username,
        'comment_added',
        `Commented on task ${task.id}`,
        'task',
        task.id,
        task.projectId
      );
    }

    // Handling worklog addition
    if (body.addWorkLog) {
      const { workCompleted, workRemaining, hours, description, blockerProblem, nextStep, evidenceLink, date } = body.addWorkLog;
      const completedPoints = Number(workCompleted ?? hours ?? 1);
      const remainingPoints = Number(workRemaining ?? 0);
      const newWorkLog = {
        id: `wl-${Date.now()}`,
        userId: user.id || 'u-unknown',
        userName: user.name || user.username,
        workCompleted: completedPoints,
        workRemaining: remainingPoints,
        blockerProblem: blockerProblem || undefined,
        nextStep: nextStep || description || undefined,
        evidenceLink: evidenceLink || undefined,
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      task.worklogs.push(newWorkLog);

      // Recalculate actualEffort (sum of workCompleted)
      const totalPoints = task.worklogs.reduce((sum, w) => sum + (Number(w.workCompleted) || 0), 0);
      task.actualEffort = totalPoints;

      db.logActivity(
        user.id || 'u-unknown',
        user.name || user.username,
        'worklog_added',
        `Logged ${completedPoints} effort points on task ${task.id}`,
        'task',
        task.id,
        task.projectId
      );
    }

    // Status change
    if (body.status && body.status !== task.status) {
      const oldStatus = task.status;
      task.status = body.status;
      db.logActivity(
        user.id || 'u-unknown',
        user.name || user.username,
        'status_changed',
        `Changed task ${task.id} status from ${oldStatus} to ${body.status}`,
        'task',
        task.id,
        task.projectId
      );
    }

    // General field updates
    if (body.title) task.title = String(body.title).trim();
    if (body.description !== undefined) task.description = String(body.description).trim();
    if (body.assignee) task.assignee = String(body.assignee);
    if (body.priority) task.priority = body.priority;
    if (body.dueDate) task.dueDate = body.dueDate;
    if (body.deliverable !== undefined) task.deliverable = body.deliverable;
    if (body.reviewer) task.reviewer = body.reviewer;

    task.updatedAt = new Date().toISOString();
    dbData.tasks[taskIndex] = task;
    db.write(dbData);

    return NextResponse.json({ task });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const taskIndex = dbData.tasks.findIndex((t) => t.id === id);

  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = dbData.tasks[taskIndex];
  const project = dbData.projects.find((p) => p.id === task.projectId);

  // User must be a member of the project, and either project admin, task owner, or system admin
  if (!canUserAccessProject(user, task.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have access to this project');
  }

  const isProjectAdmin = project && (project.admin === user.name || project.admin === user.username || project.admin === user.id);
  const isOwner = task.owner === user.name || task.owner === user.username;

  if (user.role !== 'admin' && !isProjectAdmin && !isOwner) {
    return forbiddenResponse('Forbidden: Only project admins or task owners can delete this task');
  }

  const removed = dbData.tasks.splice(taskIndex, 1)[0];
  db.write(dbData);

  db.logActivity(
    user.id || 'u-unknown',
    user.name || user.username,
    'task_deleted',
    `Deleted task ${id}: ${removed.title}`,
    'task',
    id,
    task.projectId
  );

  return NextResponse.json({ success: true, message: `Task ${id} deleted` });
}
