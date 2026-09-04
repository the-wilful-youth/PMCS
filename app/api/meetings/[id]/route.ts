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
  const meeting = dbData.meetings.find(m => m.id === id);

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  return NextResponse.json({ meeting });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.meetings.findIndex(m => m.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const meeting = dbData.meetings[index];

  try {
    const body = await request.json();
    if (body.title) meeting.title = body.title.trim();
    if (body.date) meeting.date = body.date;
    if (body.time) meeting.time = body.time;
    if (body.attendees) meeting.attendees = body.attendees;
    if (body.agenda !== undefined) meeting.agenda = body.agenda;
    if (body.discussionNotes !== undefined) meeting.discussionNotes = body.discussionNotes;
    if (body.decisions) meeting.decisions = body.decisions;
    if (body.actionItems) meeting.actionItems = body.actionItems;

    meeting.updatedAt = new Date().toISOString();
    dbData.meetings[index] = meeting;
    db.write(dbData);

    return NextResponse.json({ meeting });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update meeting' }, { status: 500 });
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
  const index = dbData.meetings.findIndex(m => m.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
  }

  const removed = dbData.meetings.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(user.id || 'u-unknown', user.name || user.username, 'meeting_deleted', `Deleted meeting ${id}: ${removed.title}`, 'meeting', id);

  return NextResponse.json({ success: true, message: `Meeting ${id} deleted` });
}
