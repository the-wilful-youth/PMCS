import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  canUserAccessProject,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const item = dbData.research.find((r) => r.id === id);

  if (!item) {
    return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
  }

  if (item.projectId && !canUserAccessProject(user, item.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have access to this research item');
  }

  return NextResponse.json({ research: item });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.research.findIndex((r) => r.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
  }

  const item = dbData.research[index];
  if (item.projectId && !canUserAccessProject(user, item.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to modify this research item');
  }

  try {
    const body = await request.json();
    if (body.title) item.title = String(body.title).trim();
    if (body.authors) item.authors = String(body.authors).trim();
    if (body.year) item.year = Number(body.year);
    if (body.publicationVenue !== undefined) item.publicationVenue = String(body.publicationVenue).trim();
    if (body.relevance) item.relevance = body.relevance;
    if (body.status) item.status = body.status;
    if (body.fileOrLink) item.fileOrLink = String(body.fileOrLink).trim();
    if (body.relatedTask !== undefined) item.relatedTask = body.relatedTask;
    if (body.keyFindings !== undefined) item.keyFindings = String(body.keyFindings).trim();
    if (body.notes !== undefined) item.notes = String(body.notes).trim();

    item.updatedAt = new Date().toISOString();
    dbData.research[index] = item;
    db.write(dbData);

    return NextResponse.json({ research: item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update research item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.research.findIndex((r) => r.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
  }

  const item = dbData.research[index];
  if (item.projectId && !canUserAccessProject(user, item.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to delete this research item');
  }

  const removed = dbData.research.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(
    user.id || 'u-unknown',
    user.name || user.username,
    'research_deleted',
    `Deleted research paper ${id}: ${removed.title}`,
    'research',
    id,
    item.projectId
  );

  return NextResponse.json({ success: true, message: `Research item ${id} deleted` });
}
