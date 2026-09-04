import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USERS, sha256, User, Session, SESSION_COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const sanitizedUsername = (username || '').trim().toLowerCase();
    const sanitizedPassword = (password || '').trim();

    if (!sanitizedUsername || !sanitizedPassword) {
      return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
    }

    let authenticatedUser: User | null = null;

    // 1. Check default demo accounts
    const defaultUser = DEFAULT_USERS.find(
      u => u.username.toLowerCase() === sanitizedUsername && u.passwordPlain === sanitizedPassword
    );

    if (defaultUser) {
      authenticatedUser = {
        id: defaultUser.id,
        username: defaultUser.username,
        name: defaultUser.name,
        email: defaultUser.email,
        role: defaultUser.role,
      };
    } else {
      // 2. Check registered accounts in persistent database
      const dbData = db.read();
      const passwordHash = await sha256(sanitizedPassword);
      const matchedDbUser = dbData.users.find(u => {
        if (u.username.toLowerCase() !== sanitizedUsername) return false;
        return (u as any).passwordHash === passwordHash;
      });

      if (matchedDbUser) {
        authenticatedUser = {
          id: matchedDbUser.id,
          username: matchedDbUser.username,
          name: matchedDbUser.name,
          email: matchedDbUser.email,
          role: matchedDbUser.role,
        };
      }
    }

    if (!authenticatedUser) {
      return NextResponse.json({ success: false, error: 'Invalid username or password.' }, { status: 401 });
    }

    const session: Session = {
      user: authenticatedUser,
      token: `pmcs_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    const sessionString = JSON.stringify(session);
    const response = NextResponse.json({ success: true, user: authenticatedUser });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeURIComponent(sessionString),
      path: '/',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      sameSite: 'lax',
      httpOnly: false,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}