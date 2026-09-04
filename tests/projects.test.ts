import { db, Project, Task } from '@/lib/db';
import { sha256, DEFAULT_USERS } from '@/lib/auth';

describe('Multi-Project Management & Generalization Core', () => {
  let dbBackup: any;

  beforeAll(() => {
    dbBackup = JSON.parse(JSON.stringify(db.read()));
  });

  afterAll(() => {
    if (dbBackup) {
      db.write(dbBackup);
    }
  });

  test('default database initializes with default project schema', () => {
    const data = db.read();
    expect(data.projects).toBeDefined();
    expect(data.projects.length).toBeGreaterThanOrEqual(1);

    const defaultProject = data.projects[0];
    expect(defaultProject.id).toBe('PRJ-CHRONICLE');
    expect(defaultProject.name).toContain('Chronicle');
    expect(defaultProject.admin).toBe('Anurag');
    expect(defaultProject.members).toContain('Anurag');
    expect(defaultProject.members).toContain('Divyanshi');
  });

  test('creates a custom project with custom scope, lead, and team', () => {
    const data = db.read();
    const newProject: Project = {
      id: `PRJ-TEST-${Date.now()}`,
      name: 'Alpha Cloud Infrastructure',
      description: 'Next generation multi-cloud orchestration infrastructure',
      startDate: '2026-09-01',
      targetEndDate: '2026-12-31',
      status: 'Active',
      admin: 'Anurag',
      members: ['Anurag', 'Divyanshi'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.projects.push(newProject);
    db.write(data);

    const reloaded = db.read();
    const found = reloaded.projects.find(p => p.id === newProject.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Alpha Cloud Infrastructure');
    expect(found?.status).toBe('Active');
    expect(found?.members).toHaveLength(2);
  });

  test('isolates tasks and calculates project-scoped metrics', () => {
    const data = db.read();
    const customProjId = `PRJ-METRICS-${Date.now()}`;

    // Add a custom task in the custom project
    const customTask: Task = {
      id: `T-CUST-${Date.now()}`,
      title: 'Setup Kubernetes Cluster',
      description: 'Deploy EKS cluster for microservices',
      projectId: customProjId,
      workstream: 'Infrastructure',
      owner: 'Anurag',
      assignee: 'Divyanshi',
      supportingMembers: [],
      priority: 'High',
      status: 'Completed',
      startDate: '2026-09-01',
      dueDate: '2026-09-10',
      estimatedEffort: '20h',
      actualEffort: '18h',
      dependencies: [],
      deliverable: 'Running cluster',
      reviewer: 'Anurag',
      comments: [],
      worklogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.tasks.push(customTask);
    db.write(data);

    // Global metrics vs scoped metrics
    const globalMetrics = db.getDashboardMetrics();
    const customMetrics = db.getDashboardMetrics(customProjId);

    expect(customMetrics.totalTasks).toBe(1);
    expect(customMetrics.completedTasks).toBe(1);
    expect(customMetrics.overallCompletion).toBe(100);

    expect(globalMetrics.totalTasks).toBeGreaterThan(1);
  });

  test('native SHA-256 cryptographic hash works consistently with zero external dependencies', async () => {
    const plain = 'SecretPassword123!';
    const hash1 = await sha256(plain);
    const hash2 = await sha256(plain);
    const diffHash = await sha256('DifferentPassword456!');

    expect(typeof hash1).toBe('string');
    expect(hash1.length).toBe(64); // SHA-256 hex string length
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(diffHash);
  });

  test('preserves backwards compatibility with default demo users', () => {
    expect(DEFAULT_USERS).toHaveLength(4);
    const usernames = DEFAULT_USERS.map(u => u.username);
    expect(usernames).toContain('anurag');
    expect(usernames).toContain('divyanshi');
    expect(usernames).toContain('tanishk');
    expect(usernames).toContain('prajjwal');
  });
});
