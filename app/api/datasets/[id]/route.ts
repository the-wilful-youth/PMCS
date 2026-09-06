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
  const dataset = dbData.datasets.find((d) => d.id === id);

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  if (dataset.projectId && !canUserAccessProject(user, dataset.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have access to this dataset');
  }

  return NextResponse.json({ dataset });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.datasets.findIndex((d) => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const dataset = dbData.datasets[index];
  if (dataset.projectId && !canUserAccessProject(user, dataset.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to modify this dataset');
  }

  try {
    const body = await request.json();
    if (body.name) dataset.name = String(body.name).trim();
    if (body.source) dataset.source = String(body.source).trim();
    if (body.description !== undefined) dataset.description = String(body.description).trim();
    if (body.accessStatus) dataset.accessStatus = body.accessStatus;
    if (body.analysisStatus) dataset.analysisStatus = body.analysisStatus;
    if (body.size) dataset.size = body.size;
    if (body.format) dataset.format = body.format;
    if (body.license) dataset.license = body.license;
    if (body.locationOrUrl) dataset.locationOrUrl = String(body.locationOrUrl).trim();
    if (body.relatedTasks) dataset.relatedTasks = body.relatedTasks;

    dataset.updatedAt = new Date().toISOString();
    dbData.datasets[index] = dataset;
    db.write(dbData);

    return NextResponse.json({ dataset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update dataset' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.datasets.findIndex((d) => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const dataset = dbData.datasets[index];
  if (dataset.projectId && !canUserAccessProject(user, dataset.projectId, dbData)) {
    return forbiddenResponse('Forbidden: You do not have permission to delete this dataset');
  }

  const removed = dbData.datasets.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(
    user.id || 'u-unknown',
    user.name || user.username,
    'dataset_deleted',
    `Deleted dataset ${id}: ${removed.name}`,
    'dataset',
    id,
    dataset.projectId
  );

  return NextResponse.json({ success: true, message: `Dataset ${id} deleted` });
}
