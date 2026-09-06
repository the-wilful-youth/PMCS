import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { User, Session, SESSION_COOKIE_NAME } from './auth';
import { db, DatabaseSchema, Project } from './db';

const SESSION_SECRET = process.env.SESSION_SECRET || 'pmcs_enterprise_super_secret_hmac_signing_key_2026';

/**
 * Cryptographically signs a session object using HMAC-SHA256.
 * Accepts either a complete Session or a User object.
 * Returns a token in format `<base64urlPayload>.<hexSignature>`.
 */
export function signSessionToken(sessionOrUser: Session | User, expiresInSeconds = 86400): string {
  let session: Session;
  if ('user' in sessionOrUser && 'expiresAt' in sessionOrUser) {
    session = sessionOrUser as Session;
  } else {
    session = {
      user: sessionOrUser as User,
      token: `pmcs_${crypto.randomBytes(16).toString('hex')}`,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
  }
  const payloadStr = JSON.stringify(session);
  const base64Payload = Buffer.from(payloadStr, 'utf-8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('hex');
  return `${base64Payload}.${signature}`;
}

/**
 * Cryptographically verifies and parses a session token or cookie.
 * Rejects any forged, tampered, or expired tokens.
 */
export function verifySessionToken(rawToken: string): Session | null {
  if (!rawToken || typeof rawToken !== 'string') return null;

  try {
    const parts = rawToken.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SESSION_SECRET).update(base64Payload).digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }

    const payloadStr = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const session = JSON.parse(payloadStr) as Session;

    if (!session || !session.user || !session.expiresAt) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the session from the incoming NextRequest cookies.
 */
export function getSessionFromRequest(request: NextRequest): Session | null {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  if (!cookie) return null;
  const decoded = decodeURIComponent(cookie.value);
  return verifySessionToken(decoded);
}

/**
 * Verifies session cookie boolean for middleware.
 */
export function verifySessionCookie(request: NextRequest): boolean {
  return getSessionFromRequest(request) !== null;
}

/**
 * Authenticates the user from the verified session and validates against the database.
 */
export function getUserFromRequest(request: NextRequest): User | null {
  const session = getSessionFromRequest(request);
  if (!session) return null;

  try {
    const dbData = db.read();
    const dbUser = dbData.users.find(u => u.username.toLowerCase() === session.user.username.toLowerCase());
    if (dbUser) {
      if (dbUser.status === 'Inactive') {
        return null;
      }
      return {
        id: dbUser.id,
        username: dbUser.username,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
      };
    }
  } catch {
    // Fallback if db read fails
  }

  return null;
}

export function getSessionUser(request?: NextRequest): User | null {
  if (!request) return null;
  return getUserFromRequest(request);
}

export const getAuthenticatedUser = getUserFromRequest;

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden: Access denied') {
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
      errorResponse: forbiddenResponse('Forbidden: Admin access required'),
    };
  }
  return { user, errorResponse: null };
}

/**
 * Checks if a user is an explicit member or admin of a project.
 */
export function isUserProjectMember(user: User, project: Project): boolean {
  if (!user || !project) return false;

  const uId = (user.id || '').toLowerCase();
  const uName = (user.name || '').toLowerCase();
  const uUser = (user.username || '').toLowerCase();

  const pAdmin = (project.admin || '').toLowerCase();
  if (pAdmin && (pAdmin === uId || pAdmin === uName || pAdmin === uUser)) {
    return true;
  }

  return (project.members || []).some(m => {
    const ml = (m || '').toLowerCase();
    return ml === uId || ml === uName || ml === uUser;
  });
}

/**
 * Checks if a user can access a specific project by ID.
 */
export function canUserAccessProject(user: User, projectId: string, dbData?: DatabaseSchema): boolean {
  if (!user || !projectId) return false;
  const data = dbData || db.read();
  const project = data.projects.find(p => p.id === projectId);
  if (!project) return false;
  if (user.role === 'admin') return true;
  return isUserProjectMember(user, project);
}

/**
 * Returns all projects that the user has explicit permission to view.
 */
export function getUserAccessibleProjects(user: User, dbData?: DatabaseSchema): Project[] {
  if (!user) return [];
  const data = dbData || db.read();
  if (user.role === 'admin') return [...data.projects];
  return data.projects.filter(p => isUserProjectMember(user, p));
}

/**
 * Returns an array of project IDs accessible to the user.
 */
export function getUserAccessibleProjectIds(user: User, dbData?: DatabaseSchema): string[] {
  return getUserAccessibleProjects(user, dbData).map(p => p.id);
}

/**
 * Route guard requiring explicit project membership.
 */
export async function requireProjectAccess(
  request: NextRequest,
  projectId: string
): Promise<{ user: User | null; project: Project | null; errorResponse: NextResponse | null }> {
  const { user, errorResponse } = await requireAuth(request);
  if (errorResponse || !user) {
    return { user: null, project: null, errorResponse: errorResponse || unauthorizedResponse() };
  }

  const dbData = db.read();
  const project = dbData.projects.find(p => p.id === projectId);
  if (!project) {
    return {
      user,
      project: null,
      errorResponse: NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 }),
    };
  }

  if (!isUserProjectMember(user, project)) {
    return {
      user,
      project: null,
      errorResponse: forbiddenResponse('Forbidden: You do not have access to this project'),
    };
  }

  return { user, project, errorResponse: null };
}