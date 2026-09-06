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
  const document = dbData.documents.find((d) => d.id === id);

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  if (document.projectId && !canUserAccessProject(user, document.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have access to this document');
  }

  return NextResponse.json({ document });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.documents.findIndex((d) => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const document = dbData.documents[index];
  if (document.projectId && !canUserAccessProject(user, document.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to modify this document');
  }

  try {
    const body = await request.json();
    if (body.name) document.name = String(body.name).trim();
    if (body.description !== undefined) document.description = String(body.description).trim();
    if (body.category) document.category = body.category;
    if (body.version) document.version = body.version;
    if (body.fileOrLink) document.fileOrLink = body.fileOrLink;
    if (body.relatedTask !== undefined) document.relatedTask = body.relatedTask;
    if (body.tags) document.tags = body.tags;

    if (body.status && body.status !== document.status) {
      const oldStatus = document.status;
      document.status = body.status;
      db.logActivity(
        user.id || 'u-unknown',
        user.name || user.username,
        'document_status_changed',
        `Changed document ${document.id} status from ${oldStatus} to ${body.status}`,
        'document',
        document.id,
        document.projectId
      );
    }

    document.lastUpdatedDate = new Date().toISOString().split('T')[0];
    document.updatedAt = new Date().toISOString();
    dbData.documents[index] = document;
    db.write(dbData);

    return NextResponse.json({ document });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.documents.findIndex((d) => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const document = dbData.documents[index];
  if (document.projectId && !canUserAccessProject(user, document.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to delete this document');
  }

  const project = document.projectId ? dbData.projects.find((p) => p.id === document.projectId) : null;
  const isProjectAdmin = project && (project.admin === user.name || project.admin === user.username || project.admin === user.id);
  const isOwner = document.owner === user.name || document.owner === user.username;

  if (user.role !== 'admin' && !isProjectAdmin && !isOwner) {
    return forbiddenResponse('Forbidden: Only project admins or document owners can delete this document');
  }

  const removed = dbData.documents.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(
    user.id || 'u-unknown',
    user.name || user.username,
    'document_deleted',
    `Deleted document ${id}: ${removed.name}`,
    'document',
    id,
    document.projectId
  );

  return NextResponse.json({ success: true, message: `Document ${id} deleted` });
}
