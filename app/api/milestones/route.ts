import { NextRequest, NextResponse } from 'next/server';
import { db, Milestone } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const dbData = db.read();
  return NextResponse.json({ milestones: dbData.milestones });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name, description, owner, targetDate, status = 'Not Started', successCriteria = [], relatedTasks = [], notes = '' } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Milestone name is required' }, { status: 400 });
    }

    const dbData = db.read();
    const nextNum = dbData.milestones.length + 1;
    const id = `MS-${String(nextNum).padStart(3, '0')}`;

    const newMilestone: Milestone = {
      id,
      name: name.trim(),
      description: description?.trim() || '',
      owner: owner || user.name || user.username,
      targetDate: targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status,
      successCriteria: Array.isArray(successCriteria) ? successCriteria : [successCriteria].filter(Boolean),
      relatedTasks: Array.isArray(relatedTasks) ? relatedTasks : [relatedTasks].filter(Boolean),
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.milestones.push(newMilestone);
    db.write(dbData);

    db.logActivity(user.id || 'u-unknown', user.name || user.username, 'milestone_created', `Created milestone ${id}: ${newMilestone.name}`, 'milestone', id);

    return NextResponse.json({ milestone: newMilestone }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create milestone' }, { status: 500 });
  }
}
