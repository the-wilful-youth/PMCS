import { NextRequest, NextResponse } from 'next/server';
import { db, DatasetItem } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const dbData = db.read();
  return NextResponse.json({ datasets: dbData.datasets });
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { name, source, description, accessStatus = 'Identified', analysisStatus = 'Not Started', size = '1 GB', format = 'CSV', license = 'Open', locationOrUrl = '', relatedTasks = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Dataset name is required' }, { status: 400 });
    }

    const dbData = db.read();
    const nextNum = dbData.datasets.length + 1;
    const id = `DS-${String(nextNum).padStart(3, '0')}`;

    const newDataset: DatasetItem = {
      id,
      name: name.trim(),
      source: source?.trim() || 'External',
      description: description?.trim() || '',
      accessStatus,
      analysisStatus,
      size: size || 'Unknown',
      format: format || 'CSV',
      license: license || 'Unknown',
      locationOrUrl: locationOrUrl.trim() || 'https://drive.google.com',
      relatedTasks: Array.isArray(relatedTasks) ? relatedTasks : [relatedTasks].filter(Boolean),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dbData.datasets.unshift(newDataset);
    db.write(dbData);

    db.logActivity(user.id || 'u-unknown', user.name || user.username, 'dataset_added', `Added dataset ${id}: ${newDataset.name}`, 'dataset', id);

    return NextResponse.json({ dataset: newDataset }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to add dataset' }, { status: 500 });
  }
}
