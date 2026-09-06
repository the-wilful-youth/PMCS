import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  getSessionUser,
  unauthorizedResponse,
  getUserAccessibleProjectIds,
  canUserAccessProject,
} from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = getSessionUser(request);
  if (!user) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().toLowerCase() || '';
  const projectId = searchParams.get('projectId') || 'all';

  if (!query) {
    return NextResponse.json([]);
  }

  const dbData = db.read();
  const accessibleProjectIds = getUserAccessibleProjectIds(user, dbData);

  const hasProjectAccess = (pid: string) => {
    if (!pid || pid === 'all') return false;
    return accessibleProjectIds.includes(pid);
  };

  const matchesQuery = (text: string) => {
    if (!text) return false;
    return text.toLowerCase().includes(query);
  };

  const results: any[] = [];

  // 1. Search Projects (only those accessible to the user)
  dbData.projects.forEach((project) => {
    if (!hasProjectAccess(project.id)) return;
    if (projectId !== 'all' && project.id !== projectId) return;

    if (matchesQuery(project.name) || matchesQuery(project.description)) {
      results.push({
        id: project.id,
        type: 'project',
        title: project.name,
        description: project.description,
        projectId: project.id,
        projectName: project.name,
        link: `/projects`,
        createdAt: project.createdAt,
      });
    }
  });

  // 2. Search Tasks
  dbData.tasks.forEach((task) => {
    if (!task.projectId || !hasProjectAccess(task.projectId)) return;
    if (projectId !== 'all' && task.projectId !== projectId) return;

    const taskProject = dbData.projects.find((p) => p.id === task.projectId);

    if (
      matchesQuery(task.title) ||
      matchesQuery(task.description) ||
      matchesQuery(task.workstream) ||
      matchesQuery(task.owner) ||
      matchesQuery(task.assignee) ||
      matchesQuery(task.deliverable) ||
      matchesQuery(task.reviewer) ||
      (task.supportingMembers || []).some((m) => matchesQuery(m)) ||
      (task.dependencies || []).some((dep) => matchesQuery(dep)) ||
      (task.comments || []).some((c) => matchesQuery(c.content)) ||
      (task.worklogs || []).some((log) => matchesQuery(log.blockerProblem || '') || matchesQuery(log.nextStep || ''))
    ) {
      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        projectId: task.projectId,
        projectName: taskProject ? taskProject.name : '',
        link: `/tasks`,
        createdAt: task.createdAt,
      });
    }
  });

  // 3. Search Milestones
  dbData.milestones.forEach((milestone) => {
    if (!milestone.projectId || !hasProjectAccess(milestone.projectId)) return;
    if (projectId !== 'all' && milestone.projectId !== projectId) return;

    const milestoneProject = dbData.projects.find((p) => p.id === milestone.projectId);

    if (
      matchesQuery(milestone.name) ||
      matchesQuery(milestone.description) ||
      matchesQuery(milestone.owner) ||
      (milestone.successCriteria || []).some((c) => matchesQuery(c)) ||
      matchesQuery(milestone.notes)
    ) {
      results.push({
        id: milestone.id,
        type: 'milestone',
        title: milestone.name,
        description: milestone.description,
        projectId: milestone.projectId,
        projectName: milestoneProject ? milestoneProject.name : '',
        link: `/milestones`,
        createdAt: milestone.createdAt,
      });
    }
  });

  // 4. Search Issues
  dbData.issues.forEach((issue) => {
    if (!issue.projectId || !hasProjectAccess(issue.projectId)) return;
    if (projectId !== 'all' && issue.projectId !== projectId) return;

    const issueProject = dbData.projects.find((p) => p.id === issue.projectId);

    if (
      matchesQuery(issue.title) ||
      matchesQuery(issue.description) ||
      matchesQuery(issue.reportedBy) ||
      matchesQuery(issue.assignedTo) ||
      matchesQuery(issue.resolution || '')
    ) {
      results.push({
        id: issue.id,
        type: 'issue',
        title: issue.title,
        description: issue.description,
        projectId: issue.projectId,
        projectName: issueProject ? issueProject.name : '',
        link: `/issues`,
        createdAt: issue.createdAt,
      });
    }
  });

  // 5. Search Documents
  dbData.documents.forEach((document) => {
    if (!document.projectId || !hasProjectAccess(document.projectId)) return;
    if (projectId !== 'all' && document.projectId !== projectId) return;

    const docProject = dbData.projects.find((p) => p.id === document.projectId);

    if (
      matchesQuery(document.name) ||
      matchesQuery(document.description) ||
      matchesQuery(document.category) ||
      matchesQuery(document.owner) ||
      (document.tags || []).some((t) => matchesQuery(t))
    ) {
      results.push({
        id: document.id,
        type: 'document',
        title: document.name,
        description: document.description,
        projectId: document.projectId,
        projectName: docProject ? docProject.name : '',
        link: `/documents`,
        createdAt: document.createdAt,
      });
    }
  });

  // 6. Search Research
  dbData.research.forEach((research) => {
    if (!research.projectId || !hasProjectAccess(research.projectId)) return;
    if (projectId !== 'all' && research.projectId !== projectId) return;

    const resProject = dbData.projects.find((p) => p.id === research.projectId);

    if (
      matchesQuery(research.title) ||
      matchesQuery(research.authors) ||
      matchesQuery(research.publicationVenue) ||
      matchesQuery(research.keyFindings) ||
      matchesQuery(research.notes)
    ) {
      results.push({
        id: research.id,
        type: 'research',
        title: research.title,
        description: research.authors,
        projectId: research.projectId,
        projectName: resProject ? resProject.name : '',
        link: `/research`,
        createdAt: research.createdAt,
      });
    }
  });

  // 7. Search Datasets
  dbData.datasets.forEach((dataset) => {
    if (!dataset.projectId || !hasProjectAccess(dataset.projectId)) return;
    if (projectId !== 'all' && dataset.projectId !== projectId) return;

    const dsProject = dbData.projects.find((p) => p.id === dataset.projectId);

    if (
      matchesQuery(dataset.name) ||
      matchesQuery(dataset.source) ||
      matchesQuery(dataset.description) ||
      matchesQuery(dataset.format)
    ) {
      results.push({
        id: dataset.id,
        type: 'dataset',
        title: dataset.name,
        description: dataset.description,
        projectId: dataset.projectId,
        projectName: dsProject ? dsProject.name : '',
        link: `/datasets`,
        createdAt: dataset.createdAt,
      });
    }
  });

  // 8. Search Meetings
  dbData.meetings.forEach((meeting) => {
    if (!meeting.projectId || !hasProjectAccess(meeting.projectId)) return;
    if (projectId !== 'all' && meeting.projectId !== projectId) return;

    const meetProject = dbData.projects.find((p) => p.id === meeting.projectId);

    if (
      matchesQuery(meeting.title) ||
      matchesQuery(meeting.agenda) ||
      matchesQuery(meeting.discussionNotes) ||
      (meeting.attendees || []).some((a) => matchesQuery(a)) ||
      (meeting.actionItems || []).some((ai) => matchesQuery(ai.text))
    ) {
      results.push({
        id: meeting.id,
        type: 'meeting',
        title: meeting.title,
        description: `${meeting.date} ${meeting.time}`,
        projectId: meeting.projectId,
        projectName: meetProject ? meetProject.name : '',
        link: `/meetings`,
        createdAt: meeting.createdAt,
      });
    }
  });

  // Sort by creation date descending
  results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(results.slice(0, 50));
}