import { NextRequest, NextResponse } from 'next/server';
import { db, Task } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  const priority = searchParams.get('priority');
  const projectId = searchParams.get('projectId');

  const dbData = db.read();
  let tasks = [...dbData.tasks];

  if (projectId && projectId !== 'all') {
    tasks = tasks.filter((t) => t.projectId === projectId);
  }

  if (status && status !== 'all') {
    tasks = tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }

  if (assignee) {
    tasks = tasks.filter(
      (t) =>
        t.assignee.toLowerCase() === assignee.toLowerCase() ||
        t.owner.toLowerCase() === assignee.toLowerCase()
    );
  }

  if (priority && priority !== 'all') {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
  }

  return NextResponse.json({ tasks });
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
      assignee,
      priority = 'Medium',
      status = 'Not Started',
      dueDate,
      workstream = 'Development',
      estimatedEffort = '10h',
      dependencies = [],
      deliverable = '',
      projectId = 'PRJ-CHRONICLE',
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const dbData = db.read();

    // Auto-generate task ID
    const nextNum = dbData.tasks.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const id = `T-${padded}`;

    const newTask: Task = {
      id,
      title: title.trim(),
      description: description?.trim() || '',
      projectId: projectId || 'PRJ-CHRONICLE',
      workstream,
      owner: user.name || user.username,
      assignee: assignee || user.name || user.username,
      supportingMembers: [],
      priority,
      status,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedEffort,
      actualEffort: '0h',
      dependencies,
      deliverable,
      reviewer: 'Anurag',
      comments: [],
      worklogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.tasks.unshift(newTask);
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'task_created',
      `Created task ${id}: ${newTask.title} (assigned to ${newTask.assignee})`,
      'task',
      id
    );

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create task' }, { status: 500 });
  }
}
