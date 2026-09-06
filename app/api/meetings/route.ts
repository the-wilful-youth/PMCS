import { NextRequest, NextResponse } from 'next/server';
import { db, MeetingItem } from '@/lib/db';
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
  let meetings = [...dbData.meetings];

  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    meetings = meetings.filter((m) => m.projectId === projectId);
  } else {
    const accessible = getUserAccessibleProjectIds(user, dbData);
    meetings = meetings.filter((m) => m.projectId && accessible.includes(m.projectId));
  }

  return NextResponse.json({ meetings });
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
      date,
      time,
      attendees = [],
      agenda = '',
      discussionNotes = '',
      decisions = [],
      actionItems = [],
      projectId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Meeting title is required' }, { status: 400 });
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
      return forbiddenResponse('Forbidden: You do not have permission to record meetings for this project');
    }

    const nextNum = dbData.meetings.length + 1;
    const id = `M-${String(nextNum).padStart(3, '0')}`;

    const formattedActionItems = (actionItems || []).map((ai: any, idx: number) => ({
      id: ai.id || `ai-${Date.now()}-${idx}`,
      text: ai.text || '',
      assignee: ai.assignee || user.name || user.username,
      dueDate: ai.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isCompleted: Boolean(ai.isCompleted),
      convertedToTaskId: ai.convertedToTaskId,
    }));

    const newMeeting: MeetingItem = {
      id,
      title: title.trim(),
      projectId: targetProjectId,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '14:00 - 15:00',
      attendees: Array.isArray(attendees) ? attendees : [attendees].filter(Boolean),
      agenda: agenda.trim(),
      discussionNotes: discussionNotes.trim(),
      decisions: Array.isArray(decisions) ? decisions : [decisions].filter(Boolean),
      actionItems: formattedActionItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.meetings.unshift(newMeeting);
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'meeting_recorded',
      `Recorded meeting ${id}: ${newMeeting.title}`,
      'meeting',
      id,
      targetProjectId
    );

    return NextResponse.json({ meeting: newMeeting }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record meeting' }, { status: 500 });
  }
}
