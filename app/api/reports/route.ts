import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  forbiddenResponse,
  canUserAccessProject,
  getUserAccessibleProjectIds,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';
  const requestedProjectId = searchParams.get('projectId');

  const dbData = db.read();
  let targetProjectIds: string[] = [];

  if (requestedProjectId && requestedProjectId !== 'all') {
    if (!canUserAccessProject(user, requestedProjectId, dbData)) {
      return forbiddenResponse('Forbidden: You do not have access to this project');
    }
    targetProjectIds = [requestedProjectId];
  } else {
    targetProjectIds = getUserAccessibleProjectIds(user, dbData);
  }

  // Filter entities by accessible projects
  const scopedTasks = dbData.tasks.filter((t) => targetProjectIds.includes(t.projectId));
  const scopedMilestones = dbData.milestones.filter((m) => m.projectId && targetProjectIds.includes(m.projectId));
  const scopedResearch = dbData.research.filter((r) => r.projectId && targetProjectIds.includes(r.projectId));
  const scopedDatasets = dbData.datasets.filter((d) => d.projectId && targetProjectIds.includes(d.projectId));
  const scopedIssues = dbData.issues.filter((i) => i.projectId && targetProjectIds.includes(i.projectId));

  // Compute metrics for accessible projects
  const totalTasks = scopedTasks.length;
  const completedTasks = scopedTasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = scopedTasks.filter((t) => t.status === 'In Progress').length;
  const blockedTasks = scopedTasks.filter((t) => t.status === 'Blocked').length;
  const readyForReview = scopedTasks.filter((t) => t.status === 'Ready for Review').length;
  const notStartedTasks = scopedTasks.filter((t) => t.status === 'Not Started').length;

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const overdueTasks = scopedTasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const due = new Date(t.dueDate);
    return due < now;
  }).length;

  const dueIn7Days = scopedTasks.filter((t) => {
    if (t.status === 'Completed') return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= in7Days;
  }).length;

  const activeMilestones = scopedMilestones.filter((m) => m.status === 'In Progress').length;
  const openIssues = scopedIssues.filter((i) => i.status === 'Open' || i.status === 'In Progress').length;
  const criticalIssues = scopedIssues.filter(
    (i) => (i.status === 'Open' || i.status === 'In Progress') && i.severity === 'Critical'
  ).length;

  const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  let healthStatus: 'ON TRACK' | 'AT RISK' | 'CRITICAL' = 'ON TRACK';
  if (criticalIssues > 0 || overdueTasks >= 3) {
    healthStatus = 'CRITICAL';
  } else if (blockedTasks > 0 || overdueTasks > 0) {
    healthStatus = 'AT RISK';
  }

  const metrics = {
    overallCompletion,
    totalTasks,
    completedTasks,
    inProgressTasks,
    blockedTasks,
    readyForReview,
    notStartedTasks,
    overdueTasks,
    dueIn7Days,
    activeMilestones,
    openIssues,
    criticalIssues,
    healthStatus,
    recentActivity: dbData.activity
      .filter((a) => a.projectId && targetProjectIds.includes(a.projectId))
      .slice(0, 10),
  };

  // Progress summary
  const progressReport = {
    generatedAt: new Date().toISOString(),
    metrics,
    milestones: scopedMilestones.map((m) => ({
      id: m.id,
      name: m.name,
      status: m.status,
      targetDate: m.targetDate,
      taskCount: (m.relatedTasks || []).length,
    })),
  };

  // Member contribution report restricted to users in the same projects
  const accessibleProjects = dbData.projects.filter((p) => targetProjectIds.includes(p.id));
  const memberNamesSet = new Set<string>();
  accessibleProjects.forEach((p) => {
    if (p.admin) memberNamesSet.add(p.admin.toLowerCase());
    (p.members || []).forEach((m) => memberNamesSet.add(m.toLowerCase()));
  });

  const memberReport = dbData.users
    .filter((u) => memberNamesSet.has(u.name.toLowerCase()) || memberNamesSet.has(u.username.toLowerCase()))
    .map((u) => {
      const userTasks = scopedTasks.filter(
        (t) =>
          t.assignee.toLowerCase() === u.name.toLowerCase() ||
          t.assignee.toLowerCase() === u.username.toLowerCase()
      );
      const totalHours = userTasks.reduce((sum, t) => {
        if (typeof t.actualEffort === 'number') return sum + t.actualEffort;
        const match = String(t.actualEffort).match(/(\d+)/);
        return sum + (match ? parseInt(match[1], 10) : 0);
      }, 0);

      return {
        name: u.name,
        role: u.role,
        assignedTasks: userTasks.length,
        completedTasks: userTasks.filter((t) => t.status === 'Completed').length,
        inProgressTasks: userTasks.filter((t) => t.status === 'In Progress').length,
        loggedHours: totalHours,
      };
    });

  // Research summary
  const researchReport = {
    totalPapers: scopedResearch.length,
    byStatus: {
      Identified: scopedResearch.filter((r) => r.status === 'Identified').length,
      Reading: scopedResearch.filter((r) => r.status === 'Reading').length,
      Summarized: scopedResearch.filter((r) => r.status === 'Summarized').length,
      Applied: scopedResearch.filter((r) => r.status === 'Applied').length,
    },
    papers: scopedResearch,
  };

  // Dataset summary
  const datasetReport = {
    totalDatasets: scopedDatasets.length,
    byAccessStatus: {
      Identified: scopedDatasets.filter((d) => d.accessStatus === 'Identified').length,
      Requested: scopedDatasets.filter((d) => d.accessStatus === 'Requested').length,
      Approved: scopedDatasets.filter((d) => d.accessStatus === 'Approved').length,
      Downloaded: scopedDatasets.filter((d) => d.accessStatus === 'Downloaded').length,
    },
    datasets: scopedDatasets,
  };

  // Issues summary
  const issuesReport = {
    totalIssues: scopedIssues.length,
    openIssues: scopedIssues.filter((i) => i.status === 'Open' || i.status === 'In Progress').length,
    criticalIssues: scopedIssues.filter(
      (i) => i.severity === 'Critical' && (i.status === 'Open' || i.status === 'In Progress')
    ).length,
    issues: scopedIssues,
  };

  return NextResponse.json({
    type,
    progressReport,
    memberReport,
    researchReport,
    datasetReport,
    issuesReport,
  });
}
