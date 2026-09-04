import { NextRequest, NextResponse } from 'next/server';
import { db, Project } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');

  const dbData = db.read();
  const metrics = db.getDashboardMetrics(projectId && projectId !== 'all' ? projectId : undefined);

  // Get projects where user is a member (or all if admin)
  let userProjects: Project[] = [];
  if (user.role === 'admin') {
    userProjects = dbData.projects;
  } else {
    userProjects = dbData.projects.filter(
      (p) => p.members.includes(user.name) || p.members.includes(user.username)
    );
  }

  let tasks = dbData.tasks;
  if (projectId && projectId !== 'all') {
    tasks = tasks.filter((t) => t.projectId === projectId);
  }

  return NextResponse.json({
    metrics,
    projects: userProjects,
    team: dbData.users,
    tasks,
  });
}
