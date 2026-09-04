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
  const item = dbData.research.find(r => r.id === id);

  if (!item) {
    return NextResponse.json({ error: 'Research paper not found' }, { status: 404 });
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
  const index = dbData.research.findIndex(r => r.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Research paper not found' }, { status: 404 });
  }

  const item = dbData.research[index];

  try {
    const body = await request.json();
    if (body.title) item.title = body.title.trim();
    if (body.authors) item.authors = body.authors.trim();
    if (body.year) item.year = Number(body.year);
    if (body.publicationVenue !== undefined) item.publicationVenue = body.publicationVenue.trim();
    if (body.relevance) item.relevance = body.relevance;
    if (body.fileOrLink) item.fileOrLink = body.fileOrLink.trim();
    if (body.relatedTask !== undefined) item.relatedTask = body.relatedTask;
    if (body.keyFindings !== undefined) item.keyFindings = body.keyFindings.trim();
    if (body.notes !== undefined) item.notes = body.notes.trim();

    if (body.status && body.status !== item.status) {
      const oldStatus = item.status;
      item.status = body.status;
      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'research_status_changed', `Changed research paper ${item.id} status from ${oldStatus} to ${body.status}`, 'research', item.id);
    }

    item.updatedAt = new Date().toISOString();
    dbData.research[index] = item;
    db.write(dbData);

    return NextResponse.json({ research: item });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update research paper' }, { status: 500 });
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
  const index = dbData.research.findIndex(r => r.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Research paper not found' }, { status: 404 });
  }

  const removed = dbData.research.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(user.id || 'u-unknown', user.name || user.username, 'research_deleted', `Deleted research paper ${id}: ${removed.title}`, 'research', id);

  return NextResponse.json({ success: true, message: `Research paper ${id} deleted` });
}
