import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const task = dbData.tasks.find(t => t.id === id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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
  const taskIndex = dbData.tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const task = dbData.tasks[taskIndex];

  try {
    const body = await request.json();

    // Handling comment addition
    if (body.addComment) {
      const newComment = {
        id: `c-${Date.now()}`,
        userId: user.id || 'u-unknown',
        userName: user.name || user.username,
        content: body.addComment.trim(),
        createdAt: new Date().toISOString(),
      };
      task.comments.push(newComment);
      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'comment_added', `Commented on task ${task.id}`, 'task', task.id);
    }

    // Handling worklog addition
    if (body.addWorkLog) {
      const { hours, description, date } = body.addWorkLog;
      const newWorkLog = {
        id: `wl-${Date.now()}`,
        userId: user.id || 'u-unknown',
        userName: user.name || user.username,
        hours: Number(hours) || 1,
        description: description || 'Work performed',
        date: date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      task.worklogs.push(newWorkLog);

      // Recalculate actualEffort
      const totalHours = task.worklogs.reduce((sum, w) => sum + w.hours, 0);
      task.actualEffort = `${totalHours}h`;

      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'worklog_added', `Logged ${hours}h on task ${task.id}`, 'task', task.id);
    }

    // Status change
    if (body.status && body.status !== task.status) {
      const oldStatus = task.status;
      task.status = body.status;
      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'status_changed', `Changed task ${task.id} status from ${oldStatus} to ${body.status}`, 'task', task.id);
    }

    // General field updates
    if (body.title) task.title = body.title.trim();
    if (body.description !== undefined) task.description = body.description.trim();
    if (body.assignee) task.assignee = body.assignee;
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

  if (user.role !== 'admin') {
    return forbiddenResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const taskIndex = dbData.tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const removed = dbData.tasks.splice(taskIndex, 1)[0];
  db.write(dbData);

  db.logActivity(user.id || 'u-unknown', user.name || user.username, 'task_deleted', `Deleted task ${id}: ${removed.title}`, 'task', id);

  return NextResponse.json({ success: true, message: `Task ${id} deleted` });
}
