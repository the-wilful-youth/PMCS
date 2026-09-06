import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USERS, verifyPassword, User, Session, SESSION_COOKIE_NAME } from '@/lib/auth';
import { signSessionToken } from '@/lib/server-auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

// Server-side brute force tracker
interface RateLimitEntry {
  count: number;
  lockoutUntil: number;
}
const serverAttempts = new Map<string, RateLimitEntry>();

function checkServerRateLimit(key: string): { allowed: boolean; remainingSec?: number } {
  const now = Date.now();
  const entry = serverAttempts.get(key);
  if (!entry) return { allowed: true };

  if (entry.lockoutUntil > now) {
    return { allowed: false, remainingSec: Math.ceil((entry.lockoutUntil - now) / 1000) };
  }

  if (entry.lockoutUntil <= now && entry.lockoutUntil > 0) {
    serverAttempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordServerFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = serverAttempts.get(key) || { count: 0, lockoutUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockoutUntil = now + LOCKOUT_MS;
    entry.count = 0;
  }
  serverAttempts.set(key, entry);
}

function clearServerAttempts(key: string): void {
  serverAttempts.delete(key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const sanitizedUsername = (username || '').trim().toLowerCase();
    const sanitizedPassword = (password || '').trim();

    if (!sanitizedUsername || !sanitizedPassword) {
      return NextResponse.json({ success: false, error: 'Username and password are required.' }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateLimitKey = `${ip}:${sanitizedUsername}`;
    const rateCheck = checkServerRateLimit(rateLimitKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many failed attempts. Account locked for ${rateCheck.remainingSec}s.` },
        { status: 429 }
      );
    }

    let authenticatedUser: User | null = null;

    // 1. Check default demo accounts
    for (const u of DEFAULT_USERS) {
      if (u.username.toLowerCase() === sanitizedUsername) {
        const isMatch = await verifyPassword(sanitizedPassword, u.passwordHash);
        if (isMatch) {
          authenticatedUser = {
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            role: u.role,
          };
          break;
        }
      }
    }

    // 2. Check registered accounts in database
    if (!authenticatedUser) {
      const dbData = db.read();
      const matchedDbUser = dbData.users.find(u => u.username.toLowerCase() === sanitizedUsername);

      if (matchedDbUser && (matchedDbUser as any).passwordHash) {
        const isMatch = await verifyPassword(sanitizedPassword, (matchedDbUser as any).passwordHash);
        if (isMatch && matchedDbUser.status !== 'Inactive') {
          authenticatedUser = {
            id: matchedDbUser.id,
            username: matchedDbUser.username,
            name: matchedDbUser.name,
            email: matchedDbUser.email,
            role: matchedDbUser.role,
          };
        }
      }
    }

    if (!authenticatedUser) {
      recordServerFailedAttempt(rateLimitKey);
      return NextResponse.json({ success: false, error: 'Invalid username or password.' }, { status: 401 });
    }

    clearServerAttempts(rateLimitKey);

    const session: Session = {
      user: authenticatedUser,
      token: `pmcs_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    // Cryptographically sign the session token
    const signedToken = signSessionToken(session);
    const response = NextResponse.json({ success: true, user: authenticatedUser });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: encodeURIComponent(signedToken),
      path: '/',
      maxAge: Math.floor(SESSION_DURATION_MS / 1000),
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}