import { login, logout, isAuthenticated, getCurrentUser, parseSession } from '@/lib/auth';

describe('Auth Security Module', () => {
  beforeEach(() => {
    logout();
  });

  test('rejects empty or whitespace-only credentials', async () => {
    expect((await login('', '')).success).toBe(false);
    expect((await login('   ', '   ')).success).toBe(false);
    expect((await login('anurag', '')).success).toBe(false);
    expect((await login('', 'password')).success).toBe(false);
  });

  test('rejects incorrect passwords for existing users', async () => {
    const res = await login('anurag', 'WrongPassword123');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid username or password/i);
    expect(isAuthenticated()).toBe(false);
  });

  test('rejects non-existent users', async () => {
    const res = await login('nonexistent_user', 'Admin@123456');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/invalid username or password/i);
    expect(isAuthenticated()).toBe(false);
  });

  test('authenticates admin user with correct password', async () => {
    const res = await login('anurag', 'Admin@123456');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('admin');
    expect(isAuthenticated()).toBe(true);
    expect(getCurrentUser()?.username).toBe('anurag');
  });

  test('authenticates team member with correct password', async () => {
    const res = await login('divyanshi', 'Member@123456');
    expect(res.success).toBe(true);
    expect(res.user?.role).toBe('member');
    expect(isAuthenticated()).toBe(true);
    expect(getCurrentUser()?.username).toBe('divyanshi');
  });

  test('clears session on logout', async () => {
    await login('anurag', 'Admin@123456');
    expect(isAuthenticated()).toBe(true);
    logout();
    expect(isAuthenticated()).toBe(false);
    expect(getCurrentUser()).toBeNull();
  });

  test('validates session parsing and rejects expired sessions', () => {
    const validSession = {
      user: { id: '1', username: 'test', name: 'Test', email: 'test@pmcs.local', role: 'member' as const },
      token: 'tok_123',
      expiresAt: Date.now() + 60000,
    };
    expect(parseSession(JSON.stringify(validSession))).not.toBeNull();

    const expiredSession = {
      ...validSession,
      expiresAt: Date.now() - 1000,
    };
    expect(parseSession(JSON.stringify(expiredSession))).toBeNull();
    expect(parseSession('malformed json')).toBeNull();
  });

  test('enforces rate limiting lockout after 5 consecutive failures', async () => {
    const testUsername = 'test_rate_user';
    for (let i = 0; i < 5; i++) {
      await login(testUsername, 'bad_pass');
    }
    const lockedRes = await login(testUsername, 'bad_pass');
    expect(lockedRes.success).toBe(false);
    expect(lockedRes.error).toMatch(/too many failed attempts/i);
  });
});
