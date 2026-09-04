import { NextRequest, NextResponse } from 'next/server';
import { db, DocumentItem } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const dbData = db.read();
  return NextResponse.json({ documents: dbData.documents });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name, description, category = 'Project Planning', version = '1.0', status = 'Draft', fileOrLink, relatedTask, tags = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
    }

    const dbData = db.read();
    const nextNum = dbData.documents.length + 1;
    const id = `D-${String(nextNum).padStart(3, '0')}`;

    const newDoc: DocumentItem = {
      id,
      name: name.trim(),
      description: description?.trim() || '',
      category,
      owner: user.name || user.username,
      version,
      status,
      fileOrLink: fileOrLink || 'https://drive.google.com/example',
      relatedTask: relatedTask || undefined,
      uploadedDate: new Date().toISOString().split('T')[0],
      lastUpdatedDate: new Date().toISOString().split('T')[0],
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.documents.unshift(newDoc);
    db.write(dbData);

    db.logActivity(user.id || 'u-unknown', user.name || user.username, 'document_uploaded', `Uploaded document ${id}: ${newDoc.name}`, 'document', id);

    return NextResponse.json({ document: newDoc }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create document' }, { status: 500 });
  }
}
