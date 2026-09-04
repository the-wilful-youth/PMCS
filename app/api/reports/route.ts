import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser, unauthorizedResponse } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  const dbData = db.read();
  const metrics = db.getDashboardMetrics();

  // Progress summary
  const progressReport = {
    generatedAt: new Date().toISOString(),
    metrics,
    milestones: dbData.milestones.map(m => ({
      id: m.id,
      name: m.name,
      status: m.status,
      targetDate: m.targetDate,
      taskCount: m.relatedTasks.length,
    })),
  };

  // Member contribution report
  const memberReport = dbData.users.map(u => {
    const userTasks = dbData.tasks.filter(t => 
      t.assignee.toLowerCase() === u.name.toLowerCase() || 
      t.assignee.toLowerCase() === u.username.toLowerCase()
    );
    const totalHours = userTasks.reduce((sum, t) => {
      const match = t.actualEffort.match(/(\d+)/);
      return sum + (match ? parseInt(match[1], 10) : 0);
    }, 0);

    return {
      name: u.name,
      role: u.role,
      assignedTasks: userTasks.length,
      completedTasks: userTasks.filter(t => t.status === 'Completed').length,
      inProgressTasks: userTasks.filter(t => t.status === 'In Progress').length,
      loggedHours: totalHours,
    };
  });

  // Research summary
  const researchReport = {
    totalPapers: dbData.research.length,
    byStatus: {
      Identified: dbData.research.filter(r => r.status === 'Identified').length,
      Reading: dbData.research.filter(r => r.status === 'Reading').length,
      Summarized: dbData.research.filter(r => r.status === 'Summarized').length,
      Applied: dbData.research.filter(r => r.status === 'Applied').length,
    },
    papers: dbData.research,
  };

  // Dataset summary
  const datasetReport = {
    totalDatasets: dbData.datasets.length,
    byAccessStatus: {
      Identified: dbData.datasets.filter(d => d.accessStatus === 'Identified').length,
      Requested: dbData.datasets.filter(d => d.accessStatus === 'Requested').length,
      Approved: dbData.datasets.filter(d => d.accessStatus === 'Approved').length,
      Downloaded: dbData.datasets.filter(d => d.accessStatus === 'Downloaded').length,
    },
    datasets: dbData.datasets,
  };

  // Issues summary
  const issuesReport = {
    totalIssues: dbData.issues.length,
    openIssues: dbData.issues.filter(i => i.status === 'Open' || i.status === 'In Progress').length,
    criticalIssues: dbData.issues.filter(i => i.severity === 'Critical' && (i.status === 'Open' || i.status === 'In Progress')).length,
    issues: dbData.issues,
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
