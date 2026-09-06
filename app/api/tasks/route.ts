import { NextRequest, NextResponse } from 'next/server';
import { db, Task } from '@/lib/db';
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
  const status = searchParams.get('status');
  const assignee = searchParams.get('assignee');
  const priority = searchParams.get('priority');
  const projectId = searchParams.get('projectId');
  const owner = searchParams.get('owner');
  const dueDate = searchParams.get('dueDate');
  const dueDateBefore = searchParams.get('dueDateBefore');
  const dueDateAfter = searchParams.get('dueDateAfter');
  const workstream = searchParams.get('workstream');
  const milestoneId = searchParams.get('milestoneId');

  const dbData = db.read();
  let tasks = [...dbData.tasks];

  // Enforce project authorization
  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    tasks = tasks.filter((t) => t.projectId === projectId);
  } else {
    // Restrict to projects the user is explicitly a member of
    const accessibleProjectIds = getUserAccessibleProjectIds(user, dbData);
    tasks = tasks.filter((t) => accessibleProjectIds.includes(t.projectId));
  }

  // Filter by status
  if (status && status !== 'all') {
    tasks = tasks.filter((t) => t.status.toLowerCase() === status.toLowerCase());
  }

  // Filter by assignee (matches assignee or owner)
  if (assignee) {
    const assigneeLower = assignee.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.assignee.toLowerCase() === assigneeLower ||
        t.owner.toLowerCase() === assigneeLower
    );
  }

  // Filter by owner (exact match on owner)
  if (owner) {
    const ownerLower = owner.toLowerCase();
    tasks = tasks.filter((t) => t.owner.toLowerCase() === ownerLower);
  }

  // Filter by priority
  if (priority && priority !== 'all') {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
  }

  // Filter by workstream
  if (workstream) {
    tasks = tasks.filter((t) => t.workstream.toLowerCase() === workstream.toLowerCase());
  }

  // Filter by dueDate (exact match)
  if (dueDate) {
    tasks = tasks.filter((t) => t.dueDate === dueDate);
  }

  // Filter by dueDateBefore
  if (dueDateBefore) {
    tasks = tasks.filter((t) => t.dueDate <= dueDateBefore);
  }

  // Filter by dueDateAfter
  if (dueDateAfter) {
    tasks = tasks.filter((t) => t.dueDate >= dueDateAfter);
  }

  // Filter by milestoneId
  if (milestoneId) {
    const milestone = dbData.milestones.find((m) => m.id === milestoneId);
    if (milestone && milestone.relatedTasks) {
      tasks = tasks.filter((t) => milestone.relatedTasks.includes(t.id));
    } else {
      tasks = [];
    }
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
      projectId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    if (!projectId || !projectId.trim()) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const dbData = db.read();
    const targetProject = dbData.projects.find((p) => p.id === projectId.trim());
    if (!targetProject) {
      return NextResponse.json({ error: 'Target project not found' }, { status: 404 });
    }

    if (!canUserAccessProject(user, targetProject.id, dbData)) {
      return forbiddenResponse('Forbidden: You do not have permission to add tasks to this project');
    }

    // Auto-generate task ID
    const nextNum = dbData.tasks.length + 1;
    const padded = String(nextNum).padStart(3, '0');
    const id = `T-${padded}`;

    const newTask: Task = {
      id,
      title: title.trim(),
      description: description?.trim() || '',
      projectId: targetProject.id,
      workstream,
      owner: user.name || user.username,
      assignee: assignee || user.name || user.username,
      supportingMembers: [],
      priority,
      status,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedEffort: Number(estimatedEffort) || 1,
      actualEffort: 0,
      dependencies: Array.isArray(dependencies) ? dependencies : [],
      deliverable: deliverable || '',
      reviewer: targetProject.admin || user.name || user.username,
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
      id,
      targetProject.id
    );

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create task' }, { status: 500 });
  }
}
