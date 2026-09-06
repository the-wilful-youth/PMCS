import { NextRequest, NextResponse } from 'next/server';
import { db, Task } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  canUserAccessProject,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id: meetingId } = await params;
  const dbData = db.read();
  const meeting = dbData.meetings.find((m) => m.id === meetingId);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  // Ensure meeting has a project and user has access
  const targetProjectId = meeting.projectId || 'PRJ-CHRONICLE';
  if (!canUserAccessProject(user, targetProjectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to convert action items in this meeting');
  }

  try {
    const { actionItemId } = await request.json();
    const actionItem = meeting.actionItems.find((ai) => ai.id === actionItemId);

    if (!actionItem) {
      return NextResponse.json({ error: 'Action item not found in meeting' }, { status: 404 });
    }

    if (actionItem.convertedToTaskId) {
      return NextResponse.json(
        {
          error: `Action item already converted to task ${actionItem.convertedToTaskId}`,
          taskId: actionItem.convertedToTaskId,
        },
        { status: 400 }
      );
    }

    const parentProject = dbData.projects.find((p) => p.id === targetProjectId);

    // Create a new task from this action item scoped to the meeting's project
    const nextNum = dbData.tasks.length + 1;
    const taskId = `T-${String(nextNum).padStart(3, '0')}`;

    const newTask: Task = {
      id: taskId,
      title: actionItem.text,
      description: `Action item converted from meeting ${meeting.id} (${meeting.title})`,
      projectId: targetProjectId,
      workstream: 'Meeting Action',
      owner: user.name || user.username,
      assignee: actionItem.assignee || user.name || user.username,
      supportingMembers: [],
      priority: 'Medium',
      status: 'Not Started',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: actionItem.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedEffort: 5,
      actualEffort: 0,
      dependencies: [],
      deliverable: `Completed action item from meeting ${meeting.id}`,
      reviewer: parentProject?.admin || user.name || user.username,
      comments: [],
      worklogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.tasks.unshift(newTask);
    actionItem.convertedToTaskId = taskId;
    meeting.updatedAt = new Date().toISOString();
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'action_converted_to_task',
      `Converted meeting action item from ${meeting.id} to Task ${taskId}: ${newTask.title}`,
      'task',
      taskId,
      targetProjectId
    );

    return NextResponse.json({ success: true, task: newTask, meeting }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to convert action item to task' }, { status: 500 });
  }
}
