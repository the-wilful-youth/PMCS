/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import {
  signSessionToken,
  verifySessionToken,
  getAuthenticatedUser,
  canUserAccessProject,
  getUserAccessibleProjectIds,
  getUserAccessibleProjects,
} from '@/lib/server-auth';
import { GET as getTasks } from '@/app/api/tasks/route';
import { GET as getMetrics } from '@/app/api/metrics/route';
import { GET as getHealth } from '@/app/api/health/route';
import { POST as handleSignup } from '@/app/api/auth/signup/route';
import { db } from '@/lib/db';
import { AuthUser } from '@/lib/auth';

describe('Security & Multi-Tenant Authorization Enforcement', () => {
  let dbBackup: any;

  beforeAll(() => {
    dbBackup = JSON.parse(JSON.stringify(db.read()));
  });

  afterAll(() => {
    if (dbBackup) {
      db.write(dbBackup);
    }
  });

  describe('HMAC Session Token Security', () => {
    const mockUser: AuthUser = {
      id: 'u-sec-test',
      username: 'sectest',
      name: 'Sec Test',
      email: 'sec@pmcs.local',
      role: 'member',
    };

    test('generates cryptographically signed session tokens', () => {
      const token = signSessionToken(mockUser, 3600);
      expect(token).toContain('.');
      const parts = token.split('.');
      expect(parts.length).toBe(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBe(64); // 32-byte hex HMAC-SHA256
    });

    test('successfully verifies authentic signed session tokens', () => {
      const token = signSessionToken(mockUser, 3600);
      const session = verifySessionToken(token);
      expect(session).not.toBeNull();
      expect(session?.user.username).toBe(mockUser.username);
      expect(session?.user.role).toBe('member');
    });

    test('rejects forged session tokens with altered payload', () => {
      const token = signSessionToken(mockUser, 3600);
      const [payload, sig] = token.split('.');

      // Attacker attempts privilege escalation by altering role to admin
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
      decoded.user.role = 'admin';
      const tamperedPayload = Buffer.from(JSON.stringify(decoded), 'utf8').toString('base64url');
      const tamperedToken = `${tamperedPayload}.${sig}`;

      expect(verifySessionToken(tamperedToken)).toBeNull();
    });

    test('rejects forged session tokens with altered signatures', () => {
      const token = signSessionToken(mockUser, 3600);
      const [payload] = token.split('.');
      const fakeSig = 'a'.repeat(64);
      const forgedToken = `${payload}.${fakeSig}`;

      expect(verifySessionToken(forgedToken)).toBeNull();
    });

    test('rejects unsigned legacy JSON session cookies', () => {
      const rawJsonCookie = JSON.stringify({
        user: { ...mockUser, role: 'admin' },
        token: 'fake_token',
        expiresAt: Date.now() + 60000,
      });

      expect(verifySessionToken(rawJsonCookie)).toBeNull();
    });

    test('rejects expired session tokens', () => {
      // Token expired 10 seconds ago
      const expiredToken = signSessionToken(mockUser, -10);
      expect(verifySessionToken(expiredToken)).toBeNull();
    });
  });

  describe('Multi-Project RBAC Isolation Rules', () => {
    const adminUser: AuthUser = {
      id: 'u-1',
      username: 'anurag',
      name: 'Anurag',
      email: 'anurag@pmcs.local',
      role: 'admin',
    };

    const memberChronicle: AuthUser = {
      id: 'u-2',
      username: 'divyanshi',
      name: 'Divyanshi',
      email: 'divyanshi@pmcs.local',
      role: 'member',
    };

    const outsiderUser: AuthUser = {
      id: 'u-foreign-999',
      username: 'outsider',
      name: 'Outsider',
      email: 'outsider@otherteam.com',
      role: 'member',
    };

    test('allows admins to access any project', () => {
      expect(canUserAccessProject(adminUser, 'PRJ-CHRONICLE')).toBe(true);
      expect(canUserAccessProject(adminUser, 'PRJ-NONEXISTENT')).toBe(false);
    });

    test('allows members to access their assigned projects', () => {
      expect(canUserAccessProject(memberChronicle, 'PRJ-CHRONICLE')).toBe(true);
    });

    test('strictly denies members access to projects they do not belong to', () => {
      expect(canUserAccessProject(outsiderUser, 'PRJ-CHRONICLE')).toBe(false);
      expect(canUserAccessProject(null, 'PRJ-CHRONICLE')).toBe(false);
    });

    test('scopes accessible project IDs accurately by role and membership', () => {
      const allProjectIds = getUserAccessibleProjectIds(adminUser);
      expect(allProjectIds.length).toBeGreaterThan(0);
      expect(allProjectIds).toContain('PRJ-CHRONICLE');

      const outsiderProjectIds = getUserAccessibleProjectIds(outsiderUser);
      expect(outsiderProjectIds).not.toContain('PRJ-CHRONICLE');
      expect(outsiderProjectIds.length).toBe(0);
    });
  });

  describe('API Route Security Guardrails', () => {
    test('tasks endpoint rejects unauthenticated requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/tasks');
      const res = await getTasks(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toMatch(/unauthorized/i);
    });

    test('tasks endpoint rejects requests with invalid session signatures with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/tasks', {
        headers: {
          cookie: 'pmcs_session=invalid.signature.here',
        },
      });
      const res = await getTasks(req);
      expect(res.status).toBe(401);
    });

    test('metrics endpoint rejects unauthenticated requests with 401', async () => {
      const req = new NextRequest('http://localhost:3000/api/metrics');
      const res = await getMetrics(req);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.error).toMatch(/unauthorized/i);
    });

    test('health endpoint hides internal host/process telemetry from unauthenticated users', async () => {
      const req = new NextRequest('http://localhost:3000/api/health');
      const res = await getHealth(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('healthy');
      expect(body.uptimeSeconds).toBeDefined();
      // Internal reconnaissance fields must NOT be present
      expect(body.system).toBeUndefined();
      expect(body.process).toBeUndefined();
      expect(body.cache).toBeUndefined();
    });

    test('health endpoint reveals diagnostic telemetry only to authenticated admins', async () => {
      const adminUser: AuthUser = {
        id: 'u-1',
        username: 'anurag',
        name: 'Anurag',
        email: 'anurag@pmcs.local',
        role: 'admin',
      };
      const signedToken = signSessionToken(adminUser, 3600);

      const req = new NextRequest('http://localhost:3000/api/health', {
        headers: {
          cookie: `pmcs_session=${signedToken}`,
        },
      });
      const res = await getHealth(req);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('healthy');
      expect(body.system).toBeDefined();
      expect(body.process).toBeDefined();
    });

    test('signup securely creates user with member role and no auto-assigned projects', async () => {
      const testSignupUsername = `new_user_${Date.now()}`;
      const signupReq = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testSignupUsername,
          password: 'SecurePassword@123',
          name: 'Newly Registered User',
          email: `${testSignupUsername}@example.com`,
          role: 'admin', // Malicious attempt to self-promote to admin
        }),
      });

      const signupRes = await handleSignup(signupReq);
      expect(signupRes.status).toBe(201);
      const signupBody = await signupRes.json();

      // Must enforce role: 'member' regardless of client input
      expect(signupBody.user.role).toBe('member');

      // Check database to ensure no automatic enrollment into existing projects
      const currentDb = db.read();
      const createdUser = currentDb.users.find(u => u.username === testSignupUsername);
      expect(createdUser).toBeDefined();
      expect(createdUser?.role).toBe('member');

      // Ensure user was NOT auto-added to chronicle or any other existing project
      for (const prj of currentDb.projects) {
        expect(prj.members).not.toContain(testSignupUsername);
      }
    });
  });
});
