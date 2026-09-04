import { NextRequest, NextResponse } from 'next/server';
import { db, User } from '@/lib/db';
import { getSessionUser, unauthorizedResponse, forbiddenResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const dbData = db.read();
  const membersWithStats = dbData.users.map(u => {
    const userTasks = dbData.tasks.filter(t => 
      t.assignee.toLowerCase() === u.name.toLowerCase() || 
      t.assignee.toLowerCase() === u.username.toLowerCase()
    );
    const completedTasks = userTasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = userTasks.filter(t => t.status === 'In Progress').length;
    const blockedTasks = userTasks.filter(t => t.status === 'Blocked').length;

    return {
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      status: u.status,
      joinedDate: u.joinedDate,
      totalTasks: userTasks.length,
      completedTasks,
      inProgressTasks,
      blockedTasks,
    };
  });

  return NextResponse.json({ team: membersWithStats });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  if (user.role !== 'admin') {
    return forbiddenResponse();
  }

  try {
    const body = await request.json();
    const { name, username, email, role = 'member', status = 'Active', joinedDate } = body;

    if (!name || !name.trim() || !username || !username.trim()) {
      return NextResponse.json({ error: 'Name and username are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const dbData = db.read();

    if (dbData.users.some(u => u.username.toLowerCase() === cleanUsername)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const nextId = `u-${dbData.users.length + 1}`;
    const newUser: User = {
      id: nextId,
      username: cleanUsername,
      name: name.trim(),
      email: email?.trim() || `${cleanUsername}@pmcs.local`,
      role: (role === 'admin' || role === 'reviewer') ? role : 'member',
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      joinedDate: joinedDate || new Date().toISOString().split('T')[0],
    };

    dbData.users.push(newUser);
    if (!dbData.projects[0].members.includes(newUser.name)) {
      dbData.projects[0].members.push(newUser.name);
    }
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'member_added',
      `Added team member ${newUser.name} (${newUser.role})`,
      'team',
      newUser.id
    );

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add team member' }, { status: 500 });
  }
}
