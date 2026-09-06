import { NextRequest, NextResponse } from 'next/server';
import { db, User } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  getUserAccessibleProjects,
  canUserAccessProject,
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

  let relevantProjects = getUserAccessibleProjects(user, dbData);
  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    relevantProjects = relevantProjects.filter((p) => p.id === projectId);
  }

  const allowedMemberNames = new Set<string>();
  relevantProjects.forEach((p) => {
    if (p.admin) allowedMemberNames.add(p.admin.toLowerCase());
    (p.members || []).forEach((m) => allowedMemberNames.add(m.toLowerCase()));
  });

  const accessibleProjectIds = relevantProjects.map((p) => p.id);
  const scopedTasks = dbData.tasks.filter((t) => accessibleProjectIds.includes(t.projectId));

  const membersWithStats = dbData.users
    .filter(
      (u) =>
        allowedMemberNames.has(u.name.toLowerCase()) ||
        allowedMemberNames.has(u.username.toLowerCase()) ||
        u.id === user.id
    )
    .map((u) => {
      const userTasks = scopedTasks.filter(
        (t) =>
          t.assignee.toLowerCase() === u.name.toLowerCase() ||
          t.assignee.toLowerCase() === u.username.toLowerCase()
      );
      const completedTasks = userTasks.filter((t) => t.status === 'Completed').length;
      const inProgressTasks = userTasks.filter((t) => t.status === 'In Progress').length;
      const blockedTasks = userTasks.filter((t) => t.status === 'Blocked').length;

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

  try {
    const body = await request.json();
    const { name, username, email, role = 'member', status = 'Active', joinedDate, projectId } = body;

    if (!name || !name.trim() || !username || !username.trim()) {
      return NextResponse.json({ error: 'Name and username are required' }, { status: 400 });
    }

    const cleanUsername = username.trim().toLowerCase();
    const dbData = db.read();

    if (dbData.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    // Verify project authorization
    let targetProject = projectId
      ? dbData.projects.find((p) => p.id === projectId)
      : dbData.projects.find((p) => p.admin === user.name || p.admin === user.username);

    if (targetProject && !canUserAccessProject(user, targetProject.id, dbData)) {
      return forbiddenResponse('Forbidden: You do not have permission to add members to this project');
    }

    const nextId = `u-${dbData.users.length + 1}`;
    const defaultInitialHash = await hashPassword('Member@123456');

    const newUser: User = {
      id: nextId,
      username: cleanUsername,
      name: name.trim(),
      email: email?.trim() || `${cleanUsername}@pmcs.local`,
      role: role === 'admin' || role === 'reviewer' ? role : 'member',
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      joinedDate: joinedDate || new Date().toISOString().split('T')[0],
      passwordHash: defaultInitialHash,
    };

    dbData.users.push(newUser);

    if (targetProject) {
      if (!targetProject.members.includes(newUser.name)) {
        targetProject.members.push(newUser.name);
      }
    }

    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'member_added',
      `Added team member ${newUser.name} (${newUser.role})`,
      'team',
      newUser.id,
      targetProject?.id
    );

    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add team member' }, { status: 500 });
  }
}
