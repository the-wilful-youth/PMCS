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

const SESSION_COOKIE_NAME = 'pmcs_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

// Valid team members from project.md & Chronicle_Project_Management_System.xlsx
const VALID_USERS: (User & { password: string })[] = [
  { id: 'u-1', username: 'anurag', password: 'Admin@123456', role: 'admin', name: 'Anurag', email: 'anurag@pmcs.local' },
  { id: 'u-2', username: 'divyanshi', password: 'Member@123456', role: 'member', name: 'Divyanshi', email: 'divyanshi@pmcs.local' },
  { id: 'u-3', username: 'tanishk', password: 'Member@123456', role: 'member', name: 'Tanishk', email: 'tanishk@pmcs.local' },
  { id: 'u-4', username: 'prajjwal', password: 'Member@123456', role: 'member', name: 'Prajjwal', email: 'prajjwal@pmcs.local' },
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

  const user = VALID_USERS.find(
    u => u.username === sanitizedUsername && u.password === sanitizedPassword
  );

  if (!user) {
    recordFailedAttempt(rateLimitKey);
    return { success: false, error: 'Invalid username or password.' };
  }

  clearFailedAttempts(rateLimitKey);

  const sessionUser: User = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const session: Session = {
    user: sessionUser,
    token: `pmcs_${Math.random().toString(36).substring(2)}_${Date.now()}`,
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };

  const sessionString = JSON.stringify(session);
  const maxAgeSeconds = Math.floor(SESSION_DURATION_MS / 1000);

  if (typeof window !== 'undefined') {
    setCookie(SESSION_COOKIE_NAME, sessionString, maxAgeSeconds);
    try {
      window.localStorage.setItem('isAuthenticated', 'true');
      window.localStorage.setItem('username', user.username);
      window.localStorage.setItem('userRole', user.role);
      window.localStorage.setItem('userName', user.name);
      window.localStorage.setItem(SESSION_COOKIE_NAME, sessionString);
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

export const getUsername = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('username') || getSession()?.user.name || null;
  }
  return null;
};

export const getUserRole = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('userRole') || getSession()?.user.role || null;
  }
  return null;
};

export const getUserName = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('userName') || getSession()?.user.name || null;
  }
  return null;
};

export const getCurrentUser = (): User | null => {
  if (typeof window !== 'undefined' && isAuthenticated()) {
    const session = getSession();
    if (session) return session.user;
    return {
      username: getUsername() || 'user',
      role: getUserRole() || 'member',
      name: getUserName() || 'User',
    };
  }
  return null;
};

export const getAuthState = () => ({
  isAuthenticated: isAuthenticated(),
  username: getUsername(),
  role: getUserRole(),
  name: getUserName(),
});