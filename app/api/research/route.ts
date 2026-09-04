import { NextRequest, NextResponse } from 'next/server';
import { db, ResearchItem } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const dbData = db.read();
  return NextResponse.json({ research: dbData.research });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { title, authors, year = new Date().getFullYear(), publicationVenue = '', relevance = 'Medium', status = 'Identified', fileOrLink = '', relatedTask, keyFindings = '', notes = '' } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Paper title is required' }, { status: 400 });
    }

    const dbData = db.read();
    const nextNum = dbData.research.length + 1;
    const id = `R-${String(nextNum).padStart(3, '0')}`;

    const newPaper: ResearchItem = {
      id,
      title: title.trim(),
      authors: authors?.trim() || 'Unknown',
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

    db.logActivity(user.id || 'u-unknown', user.name || user.username, 'research_added', `Added research paper ${id}: ${newPaper.title}`, 'research', id);

    return NextResponse.json({ research: newPaper }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add research paper' }, { status: 500 });
  }
}
