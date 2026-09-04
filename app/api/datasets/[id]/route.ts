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
  const dataset = dbData.datasets.find(d => d.id === id);

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
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
  const index = dbData.datasets.findIndex(d => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const dataset = dbData.datasets[index];

  try {
    const body = await request.json();
    if (body.name) dataset.name = body.name.trim();
    if (body.source) dataset.source = body.source.trim();
    if (body.description !== undefined) dataset.description = body.description.trim();
    if (body.size) dataset.size = body.size;
    if (body.format) dataset.format = body.format;
    if (body.license) dataset.license = body.license;
    if (body.locationOrUrl) dataset.locationOrUrl = body.locationOrUrl.trim();
    if (body.relatedTasks) dataset.relatedTasks = body.relatedTasks;

    if (body.accessStatus && body.accessStatus !== dataset.accessStatus) {
      const oldStatus = dataset.accessStatus;
      dataset.accessStatus = body.accessStatus;
      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'dataset_access_changed', `Changed dataset ${dataset.id} access status from ${oldStatus} to ${body.accessStatus}`, 'dataset', dataset.id);
    }

    if (body.analysisStatus && body.analysisStatus !== dataset.analysisStatus) {
      const oldStatus = dataset.analysisStatus;
      dataset.analysisStatus = body.analysisStatus;
      db.logActivity(user.id || 'u-unknown', user.name || user.username, 'dataset_analysis_changed', `Changed dataset ${dataset.id} analysis status from ${oldStatus} to ${body.analysisStatus}`, 'dataset', dataset.id);
    }

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

  if (user.role !== 'admin') {
    return forbiddenResponse();
  }

  const { id } = await params;
  const dbData = db.read();
  const index = dbData.datasets.findIndex(d => d.id === id);

  if (index === -1) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
  }

  const removed = dbData.datasets.splice(index, 1)[0];
  db.write(dbData);

  db.logActivity(user.id || 'u-unknown', user.name || user.username, 'dataset_deleted', `Deleted dataset ${id}: ${removed.name}`, 'dataset', id);

  return NextResponse.json({ success: true, message: `Dataset ${id} deleted` });
}
