import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  if (user.role !== 'admin') {
    return forbiddenResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.users.findIndex(u => u.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  const member = dbData.users[index];

  try {
    const body = await request.json();
    if (body.name) member.name = body.name.trim();
    if (body.email) member.email = body.email.trim();
    if (body.role && (body.role === 'admin' || body.role === 'member' || body.role === 'reviewer')) {
      member.role = body.role;
    }
    if (body.status && (body.status === 'Active' || body.status === 'Inactive')) {
      member.status = body.status;
    }

    dbData.users[index] = member;
    db.write(dbData);

    db.logActivity(user.id || 'u-unknown', user.name || user.username, 'member_updated', `Updated team member ${member.name}`, 'team', member.id);

    return NextResponse.json({ user: member });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update team member' }, { status: 500 });
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
  const index = dbData.users.findIndex(u => u.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  const removed = dbData.users.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(user.id || 'u-unknown', user.name || user.username, 'member_removed', `Removed team member ${removed.name}`, 'team', id);

  return NextResponse.json({ success: true, message: `Team member ${id} removed` });
}
