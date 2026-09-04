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
  const milestone = dbData.milestones.find(m => m.id === id);

  if (!milestone) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  return NextResponse.json({ milestone });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.milestones.findIndex(m => m.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  const milestone = dbData.milestones[index];

  try {
    const body = await request.json();
    if (body.name) milestone.name = body.name.trim();
    if (body.description !== undefined) milestone.description = body.description.trim();
    if (body.owner) milestone.owner = body.owner;
    if (body.targetDate) milestone.targetDate = body.targetDate;
    if (body.status && body.status !== milestone.status) {
      const oldStatus = milestone.status;
      milestone.status = body.status;
      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'milestone_status_changed', `Changed milestone ${milestone.id} status from ${oldStatus} to ${body.status}`, 'milestone', milestone.id);
    }
    if (body.successCriteria) milestone.successCriteria = body.successCriteria;
    if (body.relatedTasks) milestone.relatedTasks = body.relatedTasks;
    if (body.notes !== undefined) milestone.notes = body.notes;

    milestone.updatedAt = new Date().toISOString();
    dbData.milestones[index] = milestone;
    db.write(dbData);

    return NextResponse.json({ milestone });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update milestone' }, { status: 500 });
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
  const index = dbData.milestones.findIndex(m => m.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
  }

  const removed = dbData.milestones.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(user.id || 'u-unknown', user.name || user.username, 'milestone_deleted', `Deleted milestone ${id}: ${removed.name}`, 'milestone', id);

  return NextResponse.json({ success: true, message: `Milestone ${id} deleted` });
}
