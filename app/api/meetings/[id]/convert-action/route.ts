import { NextRequest, NextResponse } from 'next/server';
import { db, Task } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id: meetingId } = await params;
  const dbData = db.read();
  const meeting = dbData.meetings.find(m => m.id === meetingId);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  try {
    const { actionItemId } = await request.json();
    const actionItem = meeting.actionItems.find(ai => ai.id === actionItemId);

    if (!actionItem) {
      return NextResponse.json({ error: 'Action item not found in meeting' }, { status: 404 });
    }

    if (actionItem.convertedToTaskId) {
      return NextResponse.json({
        error: `Action item already converted to task ${actionItem.convertedToTaskId}`,
        taskId: actionItem.convertedToTaskId
      }, { status: 400 });
    }

    // Create a new task from this action item
    const nextNum = dbData.tasks.length + 1;
    const taskId = `T-${String(nextNum).padStart(3, '0')}`;

    const newTask: Task = {
      id: taskId,
      title: actionItem.text,
      description: `Action item converted from meeting ${meeting.id} (${meeting.title})`,
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Meeting Action',
      owner: user.name || user.username,
      assignee: actionItem.assignee || user.name || user.username,
      supportingMembers: [],
      priority: 'Medium',
      status: 'Not Started',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: actionItem.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimatedEffort: '5h',
      actualEffort: '0h',
      dependencies: [],
      deliverable: `Completed action item from meeting ${meeting.id}`,
      reviewer: 'Anurag',
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
      taskId
    );

    return NextResponse.json({ success: true, task: newTask, meeting }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to convert action item to task' }, { status: 500 });
  }
}
