import { db } from '@/lib/db';

describe('PMCS Backend Database & Core Logic', () => {
  let dbBackup: any;

  beforeAll(() => {
    dbBackup = JSON.parse(JSON.stringify(db.read()));
  });

  afterAll(() => {
    if (dbBackup) {
      db.write(dbBackup);
    }
  });

  test('initializes and reads database schema with seed data', () => {
    const data = db.read();
    expect(data.users.length).toBeGreaterThanOrEqual(4);
    expect(data.tasks.length).toBeGreaterThanOrEqual(5);
    expect(data.milestones.length).toBeGreaterThanOrEqual(5);
    expect(data.issues.length).toBeGreaterThanOrEqual(2);
    expect(data.documents.length).toBeGreaterThanOrEqual(4);
    expect(data.research.length).toBeGreaterThanOrEqual(2);
    expect(data.datasets.length).toBeGreaterThanOrEqual(2);
    expect(data.meetings.length).toBeGreaterThanOrEqual(2);
  });

  test('calculates dashboard metrics accurately', () => {
    const metrics = db.getDashboardMetrics();
    expect(metrics.totalTasks).toBeGreaterThan(0);
    expect(typeof metrics.overallCompletion).toBe('number');
    expect(['ON TRACK', 'AT RISK', 'CRITICAL']).toContain(metrics.healthStatus);
    expect(metrics.openIssues).toBeGreaterThanOrEqual(0);
    expect(metrics.recentActivity.length).toBeGreaterThan(0);
  });

  test('logs activity entries into audit log', () => {
    const initialActivityCount = db.read().activity.length;
    db.logActivity(
      'u-1',
      'Anurag',
      'test_action',
      'Test activity description',
      'task',
      'T-TEST'
    );

    const updatedData = db.read();
    expect(updatedData.activity.length).toBe(initialActivityCount + 1);
    expect(updatedData.activity[0].actionType).toBe('test_action');
    expect(updatedData.activity[0].description).toBe('Test activity description');
  });

  test('converts meeting action item to a new task and maintains links', () => {
    const data = db.read();
    const meeting = data.meetings[0];
    expect(meeting).toBeDefined();
    expect(meeting.actionItems.length).toBeGreaterThan(0);

    const initialTaskCount = data.tasks.length;
    const nextTaskId = `T-${String(initialTaskCount + 1).padStart(3, '0')}`;

    // Add a test action item
    const actionItem = {
      id: `ai-test-${Date.now()}`,
      text: 'Write benchmark regression test script',
      assignee: 'Anurag',
      dueDate: '2026-10-01',
      isCompleted: false,
    };
    meeting.actionItems.push(actionItem);

    // Simulate conversion
    const newTask = {
      id: nextTaskId,
      title: actionItem.text,
      description: `Action item from meeting ${meeting.id}`,
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Meeting Action',
      owner: 'Anurag',
      assignee: actionItem.assignee,
      supportingMembers: [],
      priority: 'Medium' as const,
      status: 'Not Started' as const,
      startDate: '2026-09-01',
      dueDate: actionItem.dueDate,
      estimatedEffort: '5h',
      actualEffort: '0h',
      dependencies: [],
      deliverable: 'Completed action item',
      reviewer: 'Anurag',
      comments: [],
      worklogs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.tasks.unshift(newTask);
    actionItem.convertedToTaskId = nextTaskId;
    db.write(data);

    const reloaded = db.read();
    const foundTask = reloaded.tasks.find(t => t.id === nextTaskId);
    expect(foundTask).toBeDefined();
    expect(foundTask?.title).toBe(actionItem.text);

    const foundMeeting = reloaded.meetings.find(m => m.id === meeting.id);
    const foundAi = foundMeeting?.actionItems.find(ai => ai.id === actionItem.id);
    expect(foundAi?.convertedToTaskId).toBe(nextTaskId);
  });
});
