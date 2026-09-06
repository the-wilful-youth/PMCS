import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const unreadOnly = searchParams.get('unread') === 'true';
  const limit = parseInt(searchParams.get('limit') || '50');

  const dbData = db.read();
  let notifications = dbData.notifications
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (unreadOnly) {
    notifications = notifications.filter(n => !n.isRead);
  }

  if (!isNaN(limit)) {
    notifications = notifications.slice(0, limit);
  }

  return NextResponse.json(notifications);
}

export async function POST(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await request.json();
    const { eventType, projectId, objectType, objectId, link } = body;

    // Validate required fields
    if (!eventType || !projectId || !objectType || !objectId || !link) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verify user has access to the project
    const dbData = db.read();
    const project = dbData.projects.find(p =>
      p.id === projectId &&
      (p.members.includes(user.name) || p.members.includes(user.username) || user.role === 'admin')
    );

    if (!project) {
      return new NextResponse('Unauthorized access to project', { status: 403 });
    }

    // Create notification
    const newNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId: user.id || 'u-system',
      eventType,
      projectId,
      projectName: project.name,
      objectType,
      objectId,
      objectName: '', // Would normally lookup the object name
      link,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    dbData.notifications.unshift(newNotification);

    // Keep only last 1000 notifications to prevent unbounded growth
    if (dbData.notifications.length > 1000) {
      dbData.notifications = dbData.notifications.slice(0, 1000);
    }

    db.write(dbData);

    return NextResponse.json(newNotification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const { isRead } = await request.json();

    if (!notificationId) {
      return new NextResponse('Notification ID required', { status: 400 });
    }

    const dbData = db.read();
    const notificationIndex = dbData.notifications.findIndex(
      n => n.id === notificationId && n.userId === user.id
    );

    if (notificationIndex === -1) {
      return new NextResponse('Notification not found', { status: 404 });
    }

    dbData.notifications[notificationIndex].isRead = isRead ?? false;
    db.write(dbData);

    return NextResponse.json(dbData.notifications[notificationIndex]);
  } catch (error) {
    console.error('Error updating notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return new NextResponse('Notification ID required', { status: 400 });
    }

    const dbData = db.read();
    const initialLength = dbData.notifications.length;
    dbData.notifications = dbData.notifications.filter(
      n => !(n.id === notificationId && n.userId === user.id)
    );

    if (dbData.notifications.length === initialLength) {
      return new NextResponse('Notification not found', { status: 404 });
    }

    db.write(dbData);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}