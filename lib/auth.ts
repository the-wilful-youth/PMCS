export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'reviewer';
}

export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  user?: User;
}

const SESSION_COOKIE_NAME = 'pmcs_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Password salt & hashes for team members specified in project.md
const SALT = 'pmcs-salt:';

interface StoredUser extends User {
  passwordHash: string;
}

// Initial team defined in project.md (Section 2)
// Anurag (Project Admin) - password: Admin@123456
// Divyanshi, Tanishk, Prajjwal (Members) - password: Member@123456
const INITIAL_USERS: StoredUser[] = [
  {
    id: 'u-1',
    username: 'anurag',
    name: 'Anurag',
    email: 'anurag@pmcs.local',
    role: 'admin',
    passwordHash: '3a2d0a906776f355f30fc9f8e3bfb10b2560c41a2f40bbd8cf1ab72a7b61b593',
  },
  {
    id: 'u-2',
    username: 'divyanshi',
    name: 'Divyanshi',
    email: 'divyanshi@pmcs.local',
    role: 'member',
    passwordHash: 'bec5c1bb6b54bf27c9405f521032c74b9aa0f186c25bd6d36b6ae72312489c72',
  },
  {
    id: 'u-3',
    username: 'tanishk',
    name: 'Tanishk',
    email: 'tanishk@pmcs.local',
    role: 'member',
    passwordHash: 'bec5c1bb6b54bf27c9405f521032c74b9aa0f186c25bd6d36b6ae72312489c72',
  },
  {
    id: 'u-4',
    username: 'prajjwal',
    name: 'Prajjwal',
    email: 'prajjwal@pmcs.local',
    role: 'member',
    passwordHash: 'bec5c1bb6b54bf27c9405f521032c74b9aa0f186c25bd6d36b6ae72312489c72',
  },
];

// Helper: Cryptographic SHA-256 hash using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const TextEncoderClass = typeof TextEncoder !== 'undefined'
    ? TextEncoder
    : (await import('util')).TextEncoder;
  const encoder = new TextEncoderClass();
  const data = encoder.encode(SALT + password);

  let cryptoSubtle: SubtleCrypto;
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    cryptoSubtle = globalThis.crypto.subtle;
  } else {
    const nodeCrypto = await import('crypto');
    cryptoSubtle = (nodeCrypto.webcrypto as unknown as Crypto).subtle;
  }

  const hashBuffer = await cryptoSubtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// In-memory rate limiting tracker (per client session/username)
interface AttemptTracker {
  count: number;
  lockoutUntil: number;
}
const attempts = new Map<string, AttemptTracker>();

function checkRateLimit(key: string): { allowed: boolean; remainingLockoutMs?: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry) return { allowed: true };

  if (entry.lockoutUntil > now) {
    return { allowed: false, remainingLockoutMs: entry.lockoutUntil - now };
  }

  if (entry.lockoutUntil <= now && entry.lockoutUntil > 0) {
    attempts.delete(key);
    return { allowed: true };
  }

  return { allowed: true };
}

function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key) || { count: 0, lockoutUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockoutUntil = now + LOCKOUT_DURATION_MS;
    entry.count = 0;
  }
  attempts.set(key, entry);
}

function clearFailedAttempts(key: string): void {
  attempts.delete(key);
}

// Cookie helpers for client-side
function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  document.cookie = cookie;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

// Session parser and validator
export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const session: Session = JSON.parse(raw);
    if (!session || !session.user || !session.token || !session.expiresAt) {
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

export const getSession = (): Session | null => {
  if (typeof window === 'undefined') return null;
  
  // Try cookie first (primary secure source)
  const cookieRaw = getCookie(SESSION_COOKIE_NAME);
  const cookieSession = parseSession(cookieRaw);
  if (cookieSession) return cookieSession;

  // Fallback to localStorage
  try {
    const localRaw = window.localStorage.getItem(SESSION_COOKIE_NAME);
    const localSession = parseSession(localRaw);
    if (localSession) {
      // Re-sync to cookie
      setCookie(SESSION_COOKIE_NAME, JSON.stringify(localSession), Math.floor((localSession.expiresAt - Date.now()) / 1000));
      return localSession;
    }
  } catch {
    // Ignore storage access errors
  }

  return null;
};

export const isAuthenticated = (): boolean => {
  const session = getSession();
  return session !== null;
};

export const getCurrentUser = (): User | null => {
  const session = getSession();
  return session ? session.user : null;
};

export const getUsername = (): string | null => {
  const user = getCurrentUser();
  return user ? user.name : null;
};

export const login = async (usernameInput: string, passwordInput: string): Promise<LoginResult> => {
  const sanitizedUsername = (usernameInput || '').trim().toLowerCase();
  const sanitizedPassword = (passwordInput || '').trim();

  // Input validation
  if (!sanitizedUsername || !sanitizedPassword) {
    return { success: false, error: 'Username and password are required.' };
  }

  if (sanitizedUsername.length > 64 || sanitizedPassword.length > 128) {
    return { success: false, error: 'Input exceeds maximum permitted length.' };
  }

  // Rate limiting check
  const rateLimitKey = sanitizedUsername;
  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    const secondsLeft = Math.ceil((rateCheck.remainingLockoutMs || 0) / 1000);
    return {
      success: false,
      error: `Too many failed attempts. Account locked for ${secondsLeft}s. Please try again later.`,
    };
  }

  // Verify against user store
  const user = INITIAL_USERS.find((u) => u.username.toLowerCase() === sanitizedUsername);
  if (!user) {
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: 'Invalid username or password.' };
  }

  const computedHash = await hashPassword(sanitizedPassword);
  if (computedHash !== user.passwordHash) {
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: 'Invalid username or password.' };
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(rateLimitKey);

  // Generate secure session
  const randomBytes = Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  const sessionUser: User = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const session: Session = {
    user: sessionUser,
    token: `pmcs_${randomBytes}`,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const sessionString = JSON.stringify(session);
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);

  if (typeof window !== 'undefined') {
    setCookie(SESSION_COOKIE_NAME, sessionString, maxAgeSeconds);
    try {
      window.localStorage.setItem(SESSION_COOKIE_NAME, sessionString);
      // Clean legacy keys if present
      window.localStorage.removeItem('isAuthenticated');
      window.localStorage.removeItem('username');
    } catch {
      // Ignore storage errors
    }
  }

  return { success: true, user: sessionUser };
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    deleteCookie(SESSION_COOKIE_NAME);
    try {
      window.localStorage.removeItem(SESSION_COOKIE_NAME);
      window.localStorage.removeItem('isAuthenticated');
      window.localStorage.removeItem('username');
    } catch {
      // Ignore storage errors
    }
  }
};