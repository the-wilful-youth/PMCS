import { NextRequest, NextResponse } from 'next/server';
import { db, Project } from '@/lib/db';
import { requireAdmin, requireAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.errorResponse || !auth.user) return auth.errorResponse || unauthorizedResponse();
  const user = auth.user;

  const dbData = db.read();

  // If admin, return all projects; else return only projects where user is a member
  let projects: Project[];
  if (user.role === 'admin') {
    projects = dbData.projects;
  } else {
    projects = dbData.projects.filter((p) =>
      p.members.includes(user.name) || p.members.includes(user.username)
    );
  }

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.errorResponse || !auth.user) return auth.errorResponse || forbiddenResponse();
  const adminUser = auth.user;

  try {
    const body = await request.json();
    const {
      name,
      description,
      startDate,
      targetEndDate,
      status = 'Planning',
      members = [], // array of usernames or user names to assign
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Project description is required' }, { status: 400 });
    }
    if (!startDate || !targetEndDate) {
      return NextResponse.json({ error: 'Start and target end dates are required' }, { status: 400 });
    }

    const dbData = db.read();

    // Check for duplicate project name (case-insensitive)
    const exists = dbData.projects.some(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 });
    }

    // Validate members exist
    const validMembers: string[] = [];
    for (const memberRef of members) {
      const member = dbData.users.find(
        (u) =>
          u.username.toLowerCase() === memberRef.toLowerCase() ||
          u.id.toLowerCase() === memberRef.toLowerCase() ||
          u.name.toLowerCase() === memberRef.toLowerCase()
      );
      if (member) {
        if (!validMembers.includes(member.name)) {
          validMembers.push(member.name);
        }
      }
    }

    // Ensure creator is always a member of the project they create
    if (!validMembers.includes(adminUser.name)) {
      validMembers.push(adminUser.name);
    }

    const newProject: Project = {
      id: `PRJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      description: description.trim(),
      startDate: startDate.trim(),
      targetEndDate: targetEndDate.trim(),
      status: status as 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived',
      admin: adminUser.name,
      members: validMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.projects.push(newProject);
    db.write(dbData);

    // Log activity
    db.logActivity(
      adminUser.id || 'u-unknown',
      adminUser.name || adminUser.username,
      'project_created',
      `Created project "${newProject.name}" with ${validMembers.length} members`,
      'project',
      newProject.id
    );

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}