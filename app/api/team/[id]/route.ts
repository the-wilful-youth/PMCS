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
  const index = dbData.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  const member = dbData.users[index];

  try {
    const body = await request.json();
    if (body.name) member.name = String(body.name).trim();
    if (body.email) member.email = String(body.email).trim();
    if (body.role && (body.role === 'admin' || body.role === 'member' || body.role === 'reviewer')) {
      // If demoting an admin, ensure at least one other active admin exists
      if (member.role === 'admin' && body.role !== 'admin') {
        const remainingAdmins = dbData.users.filter((u) => u.id !== member.id && u.role === 'admin' && u.status === 'Active');
        if (remainingAdmins.length === 0) {
          return NextResponse.json(
            { error: 'Cannot demote the last remaining active system administrator' },
            { status: 400 }
          );
        }
      }
      member.role = body.role;
    }
    if (body.status && (body.status === 'Active' || body.status === 'Inactive')) {
      if (member.role === 'admin' && body.status === 'Inactive') {
        const remainingAdmins = dbData.users.filter((u) => u.id !== member.id && u.role === 'admin' && u.status === 'Active');
        if (remainingAdmins.length === 0) {
          return NextResponse.json(
            { error: 'Cannot deactivate the last remaining active system administrator' },
            { status: 400 }
          );
        }
      }
      member.status = body.status;
    }

    dbData.users[index] = member;
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'member_updated',
      `Updated team member ${member.name}`,
      'team',
      member.id
    );

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

  if (user.id === id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 });
  }

  const dbData = db.read();
  const index = dbData.users.findIndex((u) => u.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
  }

  const member = dbData.users[index];

  // Prevent deleting last admin
  if (member.role === 'admin') {
    const remainingAdmins = dbData.users.filter((u) => u.id !== member.id && u.role === 'admin' && u.status === 'Active');
    if (remainingAdmins.length === 0) {
      return NextResponse.json(
        { error: 'Cannot delete the last remaining active system administrator' },
        { status: 400 }
      );
    }
  }

  const removed = dbData.users.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(
    user.id || 'u-unknown',
    user.name || user.username,
    'member_removed',
    `Removed team member ${removed.name}`,
    'team',
    id
  );

  return NextResponse.json({ success: true, message: `Team member ${id} removed` });
}
