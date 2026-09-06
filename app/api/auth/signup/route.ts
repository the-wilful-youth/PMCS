import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_USERS, hashPassword, User, Session, SESSION_COOKIE_NAME } from '@/lib/auth';
import { signSessionToken } from '@/lib/server-auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, name, email } = body;

    const sanitizedUsername = (username || '').trim().toLowerCase();
    const sanitizedPassword = (password || '').trim();
    const sanitizedName = (name || '').trim();
    const sanitizedEmail = (email || '').trim().toLowerCase();

    if (!sanitizedUsername || !sanitizedPassword || !sanitizedName || !sanitizedEmail) {
      return NextResponse.json({ success: false, error: 'All fields (username, password, name, email) are required.' }, { status: 400 });
    }

    if (sanitizedUsername.length < 3 || sanitizedUsername.length > 64) {
      return NextResponse.json({ success: false, error: 'Username must be between 3 and 64 characters.' }, { status: 400 });
    }

    if (sanitizedPassword.length < 6 || sanitizedPassword.length > 128) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      return NextResponse.json({ success: false, error: 'Name must be between 2 and 100 characters.' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Check against default users
    if (DEFAULT_USERS.some(u => u.username.toLowerCase() === sanitizedUsername)) {
      return NextResponse.json({ success: false, error: 'Username already exists. Please choose a different username.' }, { status: 409 });
    }

    // Check against database users
    const dbData = db.read();
    const existingDbUser = dbData.users.find(
      u => u.username.toLowerCase() === sanitizedUsername || u.email.toLowerCase() === sanitizedEmail
    );

    if (existingDbUser) {
      return NextResponse.json({
        success: false,
        error: existingDbUser.username.toLowerCase() === sanitizedUsername
          ? 'Username already exists. Please choose a different username.'
          : 'Email already exists. Please use a different email address.',
      }, { status: 409 });
    }

    // Hash password with cryptographic salt and PBKDF2
    const passwordHash = await hashPassword(sanitizedPassword);
    const newUserId = `u-${Date.now()}`;
    const newUser = {
      id: newUserId,
      username: sanitizedUsername,
      name: sanitizedName,
      email: sanitizedEmail,
      role: 'member' as const, // Standard unprivileged member role
      status: 'Active' as const,
      joinedDate: new Date().toISOString().split('T')[0],
      passwordHash,
    };

    dbData.users.push(newUser);
    // Note: Do NOT auto-enroll new users into other teams' existing projects
    db.write(dbData);

    db.logActivity(
      newUserId,
      sanitizedName,
      'user_registered',
      `New member registered: ${sanitizedName} (@${sanitizedUsername})`,
      'user',
      newUserId
    );

    const sessionUser: User = {
      id: newUserId,
      username: sanitizedUsername,
      name: sanitizedName,
      email: sanitizedEmail,
      role: 'member',
    };

    const session: Session = {
      user: sessionUser,
      token: `pmcs_${Math.random().toString(36).substring(2)}_${Date.now()}`,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };

    const signedToken = signSessionToken(session);
    const response = NextResponse.json({ success: true, user: sessionUser }, { status: 201 });

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
    return NextResponse.json({ success: false, error: err.message || 'Registration failed' }, { status: 500 });
  }
}