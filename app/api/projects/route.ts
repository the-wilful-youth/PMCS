import { NextRequest, NextResponse } from 'next/server';
import { db, Project } from '@/lib/db';
import {
  requireAuth,
  unauthorizedResponse,
  getUserAccessibleProjects,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.errorResponse || !auth.user) return auth.errorResponse || unauthorizedResponse();
  const user = auth.user;

  const dbData = db.read();
  const projects = getUserAccessibleProjects(user, dbData);

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.errorResponse || !auth.user) return auth.errorResponse || unauthorizedResponse();
  const creator = auth.user;

  try {
    const body = await request.json();
    const {
      name,
      description,
      startDate,
      targetEndDate,
      status = 'Planning',
      members = [],
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

    // Check for duplicate project name
    const exists = dbData.projects.some(
      (p) => p.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (exists) {
      return NextResponse.json({ error: 'Project with this name already exists' }, { status: 409 });
    }

    // Validate members exist in DB
    const validMembers: string[] = [];
    for (const memberRef of members) {
      const member = dbData.users.find(
        (u) =>
          u.username.toLowerCase() === String(memberRef).toLowerCase() ||
          u.id.toLowerCase() === String(memberRef).toLowerCase() ||
          u.name.toLowerCase() === String(memberRef).toLowerCase()
      );
      if (member) {
        if (!validMembers.includes(member.name)) {
          validMembers.push(member.name);
        }
      }
    }

    // Ensure creator is in members
    const creatorIdentifier = creator.name || creator.username;
    if (!validMembers.includes(creatorIdentifier)) {
      validMembers.push(creatorIdentifier);
    }

    const newProject: Project = {
      id: `PRJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      description: description.trim(),
      startDate: startDate.trim(),
      targetEndDate: targetEndDate.trim(),
      status: status as 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived',
      admin: creatorIdentifier,
      members: validMembers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.projects.push(newProject);
    db.write(dbData);

    db.logActivity(
      creator.id || 'u-unknown',
      creator.name || creator.username,
      'project_created',
      `Created project "${newProject.name}" with ${validMembers.length} members`,
      'project',
      newProject.id,
      newProject.id
    );

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create project' }, { status: 500 });
  }
}