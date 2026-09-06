import { NextRequest, NextResponse } from 'next/server';
import { db, ResearchItem } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  canUserAccessProject,
  getUserAccessibleProjectIds,
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
  let research = [...dbData.research];

  if (projectId && projectId !== 'all') {
    if (!canUserAccessProject(user, projectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    research = research.filter((r) => r.projectId === projectId);
  } else {
    const accessible = getUserAccessibleProjectIds(user, dbData);
    research = research.filter((r) => r.projectId && accessible.includes(r.projectId));
  }

  return NextResponse.json({ research });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const {
      title,
      authors,
      year = new Date().getFullYear(),
      publicationVenue = '',
      relevance = 'Medium',
      status = 'Identified',
      fileOrLink = '',
      relatedTask,
      keyFindings = '',
      notes = '',
      projectId,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Paper title is required' }, { status: 400 });
    }

    const dbData = db.read();
    let targetProjectId = projectId?.trim();
    if (!targetProjectId) {
      const accessible = getUserAccessibleProjectIds(user, dbData);
      if (accessible.length > 0) {
        targetProjectId = accessible[0];
      } else {
        return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
      }
    }

    if (!canUserAccessProject(user, targetProjectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have permission to add research to this project');
    }

    const nextNum = dbData.research.length + 1;
    const id = `R-${String(nextNum).padStart(3, '0')}`;

    const newPaper: ResearchItem = {
      id,
      title: title.trim(),
      authors: authors?.trim() || 'Unknown',
      projectId: targetProjectId,
      year: Number(year) || new Date().getFullYear(),
      publicationVenue: publicationVenue.trim(),
      relevance,
      status,
      fileOrLink: fileOrLink.trim() || 'https://arxiv.org',
      relatedTask: relatedTask || undefined,
      keyFindings: keyFindings.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.research.unshift(newPaper);
    db.write(dbData);

    db.logActivity(
      user.id || 'u-unknown',
      user.name || user.username,
      'research_added',
      `Added research paper ${id}: ${newPaper.title}`,
      'research',
      id,
      targetProjectId
    );

    return NextResponse.json({ research: newPaper }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add research paper' }, { status: 500 });
  }
}
