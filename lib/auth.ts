export interface User {
  id?: string;
  username: string;
  name: string;
  email?: string;
  role: string;
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

export interface SignupResult {
  success: boolean;
  error?: string;
  user?: User;
}

export const SESSION_COOKIE_NAME = 'pmcs_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Cryptographic hash helper using Web Crypto API / SHA-256 (zero external dependency)
export async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str + 'pmcs_salt_v1');
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for node environment where crypto.subtle might be accessed via node:crypto
  try {
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha256').update(data).digest('hex');
  } catch {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  }
}

// Built-in seed accounts for instant access and test compatibility
export const DEFAULT_USERS: (User & { passwordPlain: string })[] = [
  { id: 'u-1', username: 'anurag', passwordPlain: 'Admin@123456', role: 'admin', name: 'Anurag', email: 'anurag@pmcs.local' },
  { id: 'u-2', username: 'divyanshi', passwordPlain: 'Member@123456', role: 'member', name: 'Divyanshi', email: 'divyanshi@pmcs.local' },
  { id: 'u-3', username: 'tanishk', passwordPlain: 'Member@123456', role: 'member', name: 'Tanishk', email: 'tanishk@pmcs.local' },
  { id: 'u-4', username: 'prajjwal', passwordPlain: 'Member@123456', role: 'member', name: 'Prajjwal', email: 'prajjwal@pmcs.local' },
];

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

// Cookie helpers
function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
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

  const cookieRaw = getCookie(SESSION_COOKIE_NAME);
  const cookieSession = parseSession(cookieRaw);
  if (cookieSession) return cookieSession;

  try {
    const localRaw = window.localStorage.getItem(SESSION_COOKIE_NAME);
    const localSession = parseSession(localRaw);
    if (localSession) {
      setCookie(SESSION_COOKIE_NAME, JSON.stringify(localSession), Math.floor((localSession.expiresAt - Date.now()) / 1000));
      return localSession;
    }
  } catch {
    // Ignore storage access errors
  }

  return null;
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem('isAuthenticated') === 'true' || getSession() !== null;
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;

  const session = getSession();
  if (session) return session.user;

  try {
    const username = window.localStorage.getItem('username');
    const role = window.localStorage.getItem('userRole');
    const name = window.localStorage.getItem('userName');
    if (username) {
      return {
        username,
        role: role || 'member',
        name: name || username,
      };
    }
  } catch {
    // Ignore storage access errors
  }

  return null;
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

  // 1. Check default seed accounts
  const defaultUser = DEFAULT_USERS.find(
    u => u.username.toLowerCase() === sanitizedUsername && u.passwordPlain === sanitizedPassword
  );

  let authenticatedUser: User | null = null;

  if (defaultUser) {
    authenticatedUser = {
      id: defaultUser.id,
      username: defaultUser.username,
      name: defaultUser.name,
      email: defaultUser.email,
      role: defaultUser.role,
    };
  } else if (typeof window !== 'undefined') {
    // 2. Browser check against server API for custom registered users
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sanitizedUsername, password: sanitizedPassword }),
      });
      const data = await resp.json();
      if (data.success && data.user) {
        authenticatedUser = data.user;
      }
    } catch {
      // Fallback
    }
  }

  if (!authenticatedUser) {
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: 'Invalid username or password.' };
  }

  clearFailedAttempts(rateLimitKey);

  const session: Session = {
    user: authenticatedUser,
    token: `pmcs_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const sessionString = JSON.stringify(session);
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);

  if (typeof window !== 'undefined') {
    setCookie(SESSION_COOKIE_NAME, sessionString, maxAgeSeconds);
    try {
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('username', authenticatedUser.username);
      window.localStorage.setItem('userRole', authenticatedUser.role);
      window.localStorage.setItem('userName', authenticatedUser.name);
      window.localStorage.setItem(SESSION_COOKIE_NAME, sessionString);
    } catch {
      // Ignore storage errors
    }
  }

  return { success: true, user: authenticatedUser };
};

// Self-service registration for any new user
export const signup = async (
  usernameInput: string,
  passwordInput: string,
  nameInput: string,
  emailInput: string
): Promise<SignupResult> => {
  const sanitizedUsername = (usernameInput || '').trim().toLowerCase();
  const sanitizedPassword = (passwordInput || '').trim();
  const sanitizedName = (nameInput || '').trim();
  const sanitizedEmail = (emailInput || '').trim().toLowerCase();

  // Input validation
  if (!sanitizedUsername || !sanitizedPassword || !sanitizedName || !sanitizedEmail) {
    return { success: false, error: 'All fields (username, password, name, email) are required.' };
  }

  if (sanitizedUsername.length < 3 || sanitizedUsername.length > 64) {
    return { success: false, error: 'Username must be between 3 and 64 characters.' };
  }

  if (sanitizedPassword.length < 6 || sanitizedPassword.length > 128) {
    return { success: false, error: 'Password must be at least 6 characters.' };
  }

  if (sanitizedName.length < 2 || sanitizedName.length > 100) {
    return { success: false, error: 'Name must be between 2 and 100 characters.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  // Check if username already exists in default users
  if (DEFAULT_USERS.some(u => u.username.toLowerCase() === sanitizedUsername)) {
    return { success: false, error: 'Username already exists. Please choose a different username.' };
  }

  if (typeof window !== 'undefined') {
    try {
      const resp = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: sanitizedUsername,
          password: sanitizedPassword,
          name: sanitizedName,
          email: sanitizedEmail,
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      const sessionUser: User = data.user;
      const session: Session = {
        user: sessionUser,
        token: `pmcs_${Math.random().toString(36).substring(2)}_${Date.now()}`,
        expiresAt: Date.now() + SESSION_DURATION_MS,
      };

      const sessionString = JSON.stringify(session);
      const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);
      setCookie(SESSION_COOKIE_NAME, sessionString, maxAgeSeconds);
      try {
        window.localStorage.setItem('isAuthenticated', 'true');
        window.localStorage.setItem('username', sessionUser.username);
        window.localStorage.setItem('userRole', sessionUser.role);
        window.localStorage.setItem('userName', sessionUser.name);
        window.localStorage.setItem(SESSION_COOKIE_NAME, sessionString);
      } catch {
        // Ignore storage errors
      }

      return { success: true, user: sessionUser };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  }

  return { success: false, error: 'Registration requires an active server session.' };
};

export const logout = (): void => {
  if (typeof window !== 'undefined') {
    deleteCookie(SESSION_COOKIE_NAME);
    try {
      window.localStorage.removeItem('isAuthenticated');
      window.localStorage.removeItem('username');
      window.localStorage.removeItem('userRole');
      window.localStorage.removeItem('userName');
      window.localStorage.removeItem(SESSION_COOKIE_NAME);
    } catch {
      // Ignore storage errors
    }
  }
};