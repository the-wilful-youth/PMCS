import { NextRequest, NextResponse } from 'next/server';
import { parseSession, User, SESSION_COOKIE_NAME } from './auth';
import { db } from './db';

export function getSessionFromRequest(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie) return null;
  return parseSession(decodeURIComponent(cookie.value));
}

export function getUserFromRequest(request: NextRequest): User | null {
  const session = getSessionFromRequest(request);
  if (!session) return null;

  try {
    const dbData = db.read();
    const dbUser = dbData.users.find(u => u.username.toLowerCase() === session.user.username.toLowerCase());
    if (dbUser) {
      return {
        id: dbUser.id,
        username: dbUser.username,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };
    }
  } catch {
    // Database access fallback
  }

  return session.user;
}

export function getSessionUser(request?: NextRequest): User | null {
  if (!request) return null;
  return getUserFromRequest(request);
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden: Admin access required') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export async function requireAuth(request: NextRequest): Promise<{ user: User | null; errorResponse: NextResponse | null }> {
  const user = getUserFromRequest(request);
  if (!user) {
    return {
      user: null,
      errorResponse: unauthorizedResponse(),
    };
  }
  return { user, errorResponse: null };
}

export async function requireAdmin(request: NextRequest): Promise<{ user: User | null; errorResponse: NextResponse | null }> {
  const { user, errorResponse } = await requireAuth(request);
  if (errorResponse) return { user: null, errorResponse };

  if (user?.role !== 'admin') {
    return {
      user: null,
      errorResponse: forbiddenResponse(),
    };
  }
  return { user, errorResponse: null };
}