import { NextRequest, NextResponse } from 'next/server';
import { db, Issue } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const dbData = db.read();
  return NextResponse.json({ issues: dbData.issues });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { title, description, severity = 'Medium', status = 'Open', priority = 'Medium', assignedTo, relatedTask, resolution } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }

    const dbData = db.read();
    const nextNum = dbData.issues.length + 1;
    const id = `ISS-${String(nextNum).padStart(3, '0')}`;

    const newIssue: Issue = {
      id,
      title: title.trim(),
      description: description?.trim() || '',
      severity,
      status,
      priority,
      reportedBy: user.name || user.username,
      assignedTo: assignedTo || 'Anurag',
      relatedTask: relatedTask || undefined,
      resolution: resolution || undefined,
      reportedDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.issues.unshift(newIssue);
    db.write(dbData);

    db.logActivity(user.id || 'u-unknown', user.name || user.username, 'issue_reported', `Reported issue ${id}: ${newIssue.title} (${newIssue.severity} severity)`, 'issue', id);

    return NextResponse.json({ issue: newIssue }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create issue' }, { status: 500 });
  }
}
