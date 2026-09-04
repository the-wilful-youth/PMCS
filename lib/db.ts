import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'reviewer';
  status: 'Active' | 'Inactive';
  joinedDate: string;
  passwordHash?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';
  admin: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface TaskWorkLog {
  id: string;
  userId: string;
  userName: string;
  hours: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  workstream: string;
  owner: string;
  assignee: string;
  supportingMembers: string[];
  priority: 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'In Progress' | 'Ready for Review' | 'Completed' | 'Blocked';
  startDate: string;
  dueDate: string;
  estimatedEffort: string;
  actualEffort: string;
  dependencies: string[];
  deliverable: string;
  reviewer: string;
  attachments?: string[];
  comments: TaskComment[];
  worklogs: TaskWorkLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  owner: string;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  successCriteria: string[];
  relatedTasks: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  reportedBy: string;
  assignedTo: string;
  relatedTask?: string;
  resolution?: string;
  reportedDate: string;
  resolvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  category: string;
  owner: string;
  version: string;
  status: 'Draft' | 'In Review' | 'Approved' | 'Archived';
  fileOrLink: string;
  relatedTask?: string;
  uploadedDate: string;
  lastUpdatedDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  authors: string;
  projectId?: string;
  year: number;
  publicationVenue: string;
  relevance: string;
  status: 'Identified' | 'Reading' | 'Summarized' | 'Applied';
  fileOrLink: string;
  relatedTask?: string;
  keyFindings: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  source: string;
  projectId?: string;
  description: string;
  accessStatus: 'Identified' | 'Requested' | 'Approved' | 'Downloaded';
  analysisStatus: 'Not Started' | 'In Progress' | 'Cleaned' | 'Explored' | 'Modeled';
  size: string;
  format: string;
  license: string;
  locationOrUrl: string;
  relatedTasks: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MeetingActionItem {
  id: string;
  text: string;
  assignee: string;
  dueDate: string;
  isCompleted: boolean;
  convertedToTaskId?: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  projectId?: string;
  date: string;
  time: string;
  attendees: string[];
  agenda: string;
  discussionNotes: string;
  decisions: string[];
  actionItems: MeetingActionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  actionType: string;
  description: string;
  entityType: string;
  entityId: string;
  projectId?: string;
}

export interface DatabaseSchema {
  users: User[];
  projects: Project[];
  tasks: Task[];
  milestones: Milestone[];
  issues: Issue[];
  documents: DocumentItem[];
  research: ResearchItem[];
  datasets: DatasetItem[];
  meetings: MeetingItem[];
  activity: ActivityItem[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'pmcs.json');

const INITIAL_DATA: DatabaseSchema = {
  users: [
    { id: 'u-1', username: 'anurag', name: 'Anurag', email: 'anurag@pmcs.local', role: 'admin', status: 'Active', joinedDate: '2026-08-01' },
    { id: 'u-2', username: 'divyanshi', name: 'Divyanshi', email: 'divyanshi@pmcs.local', role: 'member', status: 'Active', joinedDate: '2026-08-01' },
    { id: 'u-3', username: 'tanishk', name: 'Tanishk', email: 'tanishk@pmcs.local', role: 'member', status: 'Active', joinedDate: '2026-08-01' },
    { id: 'u-4', username: 'prajjwal', name: 'Prajjwal', email: 'prajjwal@pmcs.local', role: 'member', status: 'Active', joinedDate: '2026-08-01' },
  ],
  projects: [
    {
      id: 'PRJ-CHRONICLE',
      name: 'Chronicle: Linux Performance Management & Analysis',
      description: 'Centralized project for managing academic research, dataset acquisitions, Linux performance benchmarks, and software deliverable tracking.',
      startDate: '2026-08-01',
      targetEndDate: '2026-12-15',
      status: 'Active',
      admin: 'Anurag',
      members: ['Anurag', 'Divyanshi', 'Tanishk', 'Prajjwal'],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-09-01T10:00:00.000Z',
    },
  ],
  tasks: [
    {
      id: 'T-001',
      title: 'Set up project workspace',
      description: 'Create shared project folders and tracker',
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Management',
      owner: 'Anurag',
      assignee: 'Anurag',
      supportingMembers: [],
      priority: 'Medium',
      status: 'Completed',
      startDate: '2026-08-01',
      dueDate: '2026-09-15',
      estimatedEffort: '10h',
      actualEffort: '8h',
      dependencies: [],
      deliverable: 'Workspace and repository initialized',
      reviewer: 'Anurag',
      comments: [
        { id: 'c-1', userId: 'u-1', userName: 'Anurag', content: 'Initial folder structure configured on Google Drive and Git.', createdAt: '2026-08-05T14:30:00.000Z' }
      ],
      worklogs: [
        { id: 'wl-1', userId: 'u-1', userName: 'Anurag', hours: 8, description: 'Created directories, access permissions, and repo', date: '2026-08-05', createdAt: '2026-08-05T15:00:00.000Z' }
      ],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-05T15:00:00.000Z',
    },
    {
      id: 'T-002',
      title: 'Finalize Linux datasets',
      description: 'Select final datasets for Chronicle',
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Data',
      owner: 'Divyanshi',
      assignee: 'Divyanshi',
      supportingMembers: ['Prajjwal'],
      priority: 'High',
      status: 'In Progress',
      startDate: '2026-08-10',
      dueDate: '2026-09-20',
      estimatedEffort: '25h',
      actualEffort: '12h',
      dependencies: ['T-001'],
      deliverable: 'Dataset selection criteria and finalized list',
      reviewer: 'Anurag',
      comments: [],
      worklogs: [
        { id: 'wl-2', userId: 'u-2', userName: 'Divyanshi', hours: 12, description: 'Filtered 5 Linux trace archives down to 3 candidate sets', date: '2026-08-18', createdAt: '2026-08-18T16:00:00.000Z' }
      ],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-18T16:00:00.000Z',
    },
    {
      id: 'T-003',
      title: 'Literature review',
      description: 'Collect and summarize relevant papers',
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Research',
      owner: 'Tanishk',
      assignee: 'Tanishk',
      supportingMembers: [],
      priority: 'Medium',
      status: 'Ready for Review',
      startDate: '2026-08-10',
      dueDate: '2026-09-25',
      estimatedEffort: '30h',
      actualEffort: '28h',
      dependencies: ['T-001'],
      deliverable: 'Literature survey report summarizing 15 papers',
      reviewer: 'Anurag',
      comments: [
        { id: 'c-2', userId: 'u-3', userName: 'Tanishk', content: 'Draft survey uploaded to Documents as D-003.', createdAt: '2026-08-25T11:00:00.000Z' }
      ],
      worklogs: [],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-25T11:00:00.000Z',
    },
    {
      id: 'T-004',
      title: 'Dataset acquisition',
      description: 'Download/request access to selected datasets',
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Data',
      owner: 'Prajjwal',
      assignee: 'Prajjwal',
      supportingMembers: ['Divyanshi'],
      priority: 'High',
      status: 'Blocked',
      startDate: '2026-08-20',
      dueDate: '2026-09-30',
      estimatedEffort: '15h',
      actualEffort: '4h',
      dependencies: ['T-002'],
      deliverable: 'Raw dataset files stored securely',
      reviewer: 'Anurag',
      comments: [
        { id: 'c-3', userId: 'u-4', userName: 'Prajjwal', content: 'Blocked waiting on academic dataset approval from external university portal.', createdAt: '2026-08-28T09:30:00.000Z' }
      ],
      worklogs: [],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-28T09:30:00.000Z',
    },
    {
      id: 'T-005',
      title: 'Preprocessing pipeline',
      description: 'Prepare scripts for cleaning and preprocessing',
      projectId: 'PRJ-CHRONICLE',
      workstream: 'Development',
      owner: 'Anurag',
      assignee: 'Anurag',
      supportingMembers: ['Tanishk'],
      priority: 'Medium',
      status: 'Not Started',
      startDate: '2026-09-01',
      dueDate: '2026-10-05',
      estimatedEffort: '35h',
      actualEffort: '0h',
      dependencies: ['T-004'],
      deliverable: 'Executable Python parsing and normalization pipeline',
      reviewer: 'Anurag',
      comments: [],
      worklogs: [],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-01T09:00:00.000Z',
    },
  ],
  milestones: [
    {
      id: 'MS-001',
      name: 'Project Workspace Setup',
      description: 'Create shared project folders, initialize repository, and establish communication channels',
      projectId: 'PRJ-CHRONICLE',
      owner: 'Anurag',
      targetDate: '2026-08-05',
      status: 'Completed',
      successCriteria: [
        'Repository created with proper access controls',
        'Shared folder structure established',
        'Communication channels (Slack/Email) configured',
        'Initial documentation created'
      ],
      relatedTasks: ['T-001'],
      notes: 'Completed ahead of schedule',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-05T15:00:00.000Z',
    },
    {
      id: 'MS-002',
      name: 'Linux Dataset Selection Complete',
      description: 'Finalize selection of Linux datasets for performance analysis',
      projectId: 'PRJ-CHRONICLE',
      owner: 'Divyanshi',
      targetDate: '2026-08-20',
      status: 'In Progress',
      successCriteria: [
        'Research completed on available Linux performance datasets',
        'Evaluation criteria established and applied',
        'Final dataset selection documented and approved',
        'Access requests submitted for selected datasets'
      ],
      relatedTasks: ['T-002'],
      notes: 'Research phase ongoing, evaluation criteria defined',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-20T10:00:00.000Z',
    },
    {
      id: 'MS-003',
      name: 'Literature Review Completed',
      description: 'Finish comprehensive literature review on Linux performance analysis',
      projectId: 'PRJ-CHRONICLE',
      owner: 'Tanishk',
      targetDate: '2026-08-25',
      status: 'In Progress',
      successCriteria: [
        'Minimum of 20 relevant papers reviewed',
        'Key findings and methodologies documented',
        'Gap analysis completed',
        'Bibliography formatted according to IEEE standards'
      ],
      relatedTasks: ['T-003'],
      notes: 'Currently reviewing papers, on track for completion',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-25T11:00:00.000Z',
    },
    {
      id: 'MS-004',
      name: 'Dataset Acquisition Complete',
      description: 'Download and validate access to all selected datasets',
      projectId: 'PRJ-CHRONICLE',
      owner: 'Prajjwal',
      targetDate: '2026-08-30',
      status: 'Delayed',
      successCriteria: [
        'All selected datasets downloaded and accessible',
        'Data integrity verified through checksum validation',
        'Preprocessing compatibility confirmed',
        'Documentation of acquisition process completed'
      ],
      relatedTasks: ['T-004'],
      notes: 'Delayed due to external academic access approval pending',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-30T10:00:00.000Z',
    },
    {
      id: 'MS-005',
      name: 'Preprocessing Pipeline Operational',
      description: 'Have functional preprocessing pipeline ready for dataset processing',
      projectId: 'PRJ-CHRONICLE',
      owner: 'Anurag',
      targetDate: '2026-09-10',
      status: 'Not Started',
      successCriteria: [
        'Scripts developed for data cleaning and normalization',
        'Pipeline tested with sample data',
        'Performance benchmarks established',
        'Documentation and usage guide completed'
      ],
      relatedTasks: ['T-005'],
      notes: 'Waiting for dataset access to begin development',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-01T09:00:00.000Z',
    },
  ],
  issues: [
    {
      id: 'ISS-001',
      title: 'Dataset Access Permission Delay',
      description: 'Waiting for institutional approval to download Kernel trace datasets from University of Cambridge.',
      projectId: 'PRJ-CHRONICLE',
      severity: 'Critical',
      status: 'Open',
      priority: 'High',
      reportedBy: 'Prajjwal',
      assignedTo: 'Anurag',
      relatedTask: 'T-004',
      reportedDate: '2026-08-26',
      createdAt: '2026-08-26T10:00:00.000Z',
      updatedAt: '2026-08-26T10:00:00.000Z',
    },
    {
      id: 'ISS-002',
      title: 'Storage Limit on Google Shared Drive',
      description: 'Project folder is approaching free tier quota limit for large kernel traces.',
      projectId: 'PRJ-CHRONICLE',
      severity: 'Medium',
      status: 'In Progress',
      priority: 'Medium',
      reportedBy: 'Divyanshi',
      assignedTo: 'Anurag',
      relatedTask: 'T-001',
      reportedDate: '2026-08-28',
      createdAt: '2026-08-28T14:00:00.000Z',
      updatedAt: '2026-08-29T10:00:00.000Z',
    },
  ],
  documents: [
    {
      id: 'D-001',
      name: 'Project Charter',
      description: 'Initial project charter outlining objectives and scope',
      projectId: 'PRJ-CHRONICLE',
      category: 'Project Planning',
      owner: 'Anurag',
      version: '1.0',
      status: 'Approved',
      fileOrLink: 'https://drive.google.com/file/d/example1/view',
      relatedTask: 'T-001',
      uploadedDate: '2026-08-01',
      lastUpdatedDate: '2026-08-15',
      tags: ['charter', 'planning', 'approval'],
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-15T10:00:00.000Z',
    },
    {
      id: 'D-002',
      name: 'Linux Dataset Requirements',
      description: 'Requirements document for Linux dataset selection',
      projectId: 'PRJ-CHRONICLE',
      category: 'Research Papers',
      owner: 'Divyanshi',
      version: '0.8',
      status: 'In Review',
      fileOrLink: 'https://drive.google.com/file/d/example2/view',
      relatedTask: 'T-002',
      uploadedDate: '2026-08-05',
      lastUpdatedDate: '2026-08-20',
      tags: ['requirements', 'linux', 'datasets'],
      createdAt: '2026-08-05T09:00:00.000Z',
      updatedAt: '2026-08-20T10:00:00.000Z',
    },
    {
      id: 'D-003',
      name: 'Literature Review Template',
      description: 'Standard template for literature reviews',
      projectId: 'PRJ-CHRONICLE',
      category: 'Research Papers',
      owner: 'Tanishk',
      version: '1.2',
      status: 'Approved',
      fileOrLink: 'https://drive.google.com/file/d/example3/view',
      relatedTask: 'T-003',
      uploadedDate: '2026-08-10',
      lastUpdatedDate: '2026-08-25',
      tags: ['template', 'literature', 'review'],
      createdAt: '2026-08-10T09:00:00.000Z',
      updatedAt: '2026-08-25T10:00:00.000Z',
    },
    {
      id: 'D-004',
      name: 'Data Acquisition Plan',
      description: 'Plan for acquiring and accessing datasets',
      projectId: 'PRJ-CHRONICLE',
      category: 'Datasets',
      owner: 'Prajjwal',
      version: '0.9',
      status: 'Draft',
      fileOrLink: 'https://drive.google.com/file/d/example4/view',
      relatedTask: 'T-004',
      uploadedDate: '2026-08-12',
      lastUpdatedDate: '2026-08-22',
      tags: ['acquisition', 'plan', 'datasets'],
      createdAt: '2026-08-12T09:00:00.000Z',
      updatedAt: '2026-08-22T10:00:00.000Z',
    },
  ],
  research: [
    {
      id: 'R-001',
      title: 'Analyzing Linux Kernel Performance Under Virtualized Workloads',
      authors: 'Zhang et al.',
      projectId: 'PRJ-CHRONICLE',
      year: 2024,
      publicationVenue: 'ACM Transactions on Computer Systems',
      relevance: 'High',
      status: 'Reading',
      fileOrLink: 'https://arxiv.org/abs/2401.00001',
      relatedTask: 'T-003',
      keyFindings: 'Identifies major memory bus bottlenecks in default cgroup allocations.',
      notes: 'Key baseline methodology for trace collection.',
      createdAt: '2026-08-12T10:00:00.000Z',
      updatedAt: '2026-08-20T10:00:00.000Z',
    },
    {
      id: 'R-002',
      title: 'Automated Profiling of Operating System System Calls',
      authors: 'Kumar & Smith',
      projectId: 'PRJ-CHRONICLE',
      year: 2023,
      publicationVenue: 'IEEE S&P',
      relevance: 'Medium',
      status: 'Summarized',
      fileOrLink: 'https://arxiv.org/abs/2305.00002',
      relatedTask: 'T-003',
      keyFindings: 'eBPF overhead is under 1.2% for high-frequency kernel tracing.',
      notes: 'Supports using eBPF in our data collection scripts.',
      createdAt: '2026-08-15T11:00:00.000Z',
      updatedAt: '2026-08-22T11:00:00.000Z',
    },
  ],
  datasets: [
    {
      id: 'DS-001',
      name: 'Linux Kernel eBPF Traces 2025',
      source: 'Internal Testbed',
      projectId: 'PRJ-CHRONICLE',
      description: 'High-frequency system call trace logs during compile benchmarks',
      accessStatus: 'Downloaded',
      analysisStatus: 'In Progress',
      size: '4.2 GB',
      format: 'Parquet / CSV',
      license: 'MIT',
      locationOrUrl: 'https://drive.google.com/drive/folders/dataset-01',
      relatedTasks: ['T-002', 'T-005'],
      createdAt: '2026-08-15T10:00:00.000Z',
      updatedAt: '2026-08-25T10:00:00.000Z',
    },
    {
      id: 'DS-002',
      name: 'Cambridge Server Performance Log',
      source: 'University of Cambridge Repository',
      projectId: 'PRJ-CHRONICLE',
      description: 'Distributed file system load logs over 90 days',
      accessStatus: 'Requested',
      analysisStatus: 'Not Started',
      size: '18.5 GB',
      format: 'Binary / HDF5',
      license: 'Academic Non-Commercial',
      locationOrUrl: 'https://repository.cam.ac.uk/dataset/srv-2025',
      relatedTasks: ['T-004'],
      createdAt: '2026-08-18T12:00:00.000Z',
      updatedAt: '2026-08-26T10:00:00.000Z',
    },
  ],
  meetings: [
    {
      id: 'M-001',
      title: 'Project Kickoff & Scope Alignment',
      projectId: 'PRJ-CHRONICLE',
      date: '2026-08-05',
      time: '14:00 - 15:30',
      attendees: ['Anurag', 'Divyanshi', 'Tanishk', 'Prajjwal'],
      agenda: '1. Project objectives 2. Role distribution 3. Workspace setup',
      discussionNotes: 'Agreed on weekly sprints, assigned Divyanshi to dataset selection and Tanishk to literature review.',
      decisions: ['Use eBPF for tracing', 'Store datasets in compressed formats', 'Hold standups every Monday'],
      actionItems: [
        { id: 'ai-1', text: 'Initialize repository and folders', assignee: 'Anurag', dueDate: '2026-08-08', isCompleted: true, convertedToTaskId: 'T-001' },
        { id: 'ai-2', text: 'Prepare dataset criteria checklist', assignee: 'Divyanshi', dueDate: '2026-08-15', isCompleted: true, convertedToTaskId: 'T-002' }
      ],
      createdAt: '2026-08-05T16:00:00.000Z',
      updatedAt: '2026-08-05T16:00:00.000Z',
    },
    {
      id: 'M-002',
      title: 'Sprint 2: Datasets & Research Review',
      projectId: 'PRJ-CHRONICLE',
      date: '2026-08-20',
      time: '15:00 - 16:00',
      attendees: ['Anurag', 'Divyanshi', 'Tanishk', 'Prajjwal'],
      agenda: 'Review literature review draft and discuss access to external datasets.',
      discussionNotes: 'Prajjwal submitted Cambridge dataset request. Tanishk completed 15 paper summaries.',
      decisions: ['Escalate Cambridge dataset permission if no reply by end of month'],
      actionItems: [
        { id: 'ai-3', text: 'Follow up on Cambridge dataset access permission', assignee: 'Prajjwal', dueDate: '2026-08-28', isCompleted: false },
        { id: 'ai-4', text: 'Draft literature survey synthesis chapter', assignee: 'Tanishk', dueDate: '2026-09-05', isCompleted: false }
      ],
      createdAt: '2026-08-20T16:30:00.000Z',
      updatedAt: '2026-08-20T16:30:00.000Z',
    },
  ],
  activity: [
    { id: 'act-1', timestamp: '2026-08-01T09:00:00.000Z', userId: 'u-1', userName: 'Anurag', actionType: 'project_created', description: 'Project Chronicle created', entityType: 'project', entityId: 'PRJ-CHRONICLE', projectId: 'PRJ-CHRONICLE' },
    { id: 'act-2', timestamp: '2026-08-05T15:00:00.000Z', userId: 'u-1', userName: 'Anurag', actionType: 'task_completed', description: 'Completed task: Set up project workspace', entityType: 'task', entityId: 'T-001', projectId: 'PRJ-CHRONICLE' },
    { id: 'act-3', timestamp: '2026-08-10T10:00:00.000Z', userId: 'u-2', userName: 'Divyanshi', actionType: 'document_uploaded', description: 'Uploaded Linux Dataset Requirements (D-002)', entityType: 'document', entityId: 'D-002', projectId: 'PRJ-CHRONICLE' },
    { id: 'act-4', timestamp: '2026-08-26T10:00:00.000Z', userId: 'u-4', userName: 'Prajjwal', actionType: 'issue_reported', description: 'Reported critical blocker: Dataset Access Permission Delay', entityType: 'issue', entityId: 'ISS-001', projectId: 'PRJ-CHRONICLE' },
  ],
};

class DatabaseManager {
  private cache: DatabaseSchema | null = null;

  private ensureDirectory(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public read(): DatabaseSchema {
    this.ensureDirectory();

    if (this.cache) {
      return this.cache;
    }

    if (!fs.existsSync(DB_FILE)) {
      this.writeSync(INITIAL_DATA);
      this.cache = INITIAL_DATA;
      return this.cache;
    }

    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as DatabaseSchema;
      // Ensure all arrays exist
      if (!parsed.projects) parsed.projects = INITIAL_DATA.projects;
      if (!parsed.tasks) parsed.tasks = [];
      if (!parsed.milestones) parsed.milestones = [];
      if (!parsed.issues) parsed.issues = [];
      if (!parsed.documents) parsed.documents = [];
      if (!parsed.research) parsed.research = [];
      if (!parsed.datasets) parsed.datasets = [];
      if (!parsed.meetings) parsed.meetings = [];
      if (!parsed.activity) parsed.activity = [];
      this.cache = parsed;
      return parsed;
    } catch (err) {
      console.error('Error reading database file, using initial data fallback:', err);
      this.cache = INITIAL_DATA;
      return this.cache;
    }
  }

  private writeSync(data: DatabaseSchema): void {
    this.ensureDirectory();
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    this.cache = data;
  }

  public write(data: DatabaseSchema): void {
    this.writeSync(data);
  }

  public logActivity(userId: string, userName: string, actionType: string, description: string, entityType: string, entityId: string, projectId?: string): void {
    const dbData = this.read();
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      userId,
      userName,
      actionType,
      description,
      entityType,
      entityId,
      projectId,
    };
    dbData.activity.unshift(newActivity);
    if (dbData.activity.length > 500) {
      dbData.activity = dbData.activity.slice(0, 500);
    }
    this.write(dbData);
  }

  public getDashboardMetrics(projectId?: string) {
    const dbData = this.read();
    let tasks = dbData.tasks;
    let milestones = dbData.milestones;
    let issues = dbData.issues;

    if (projectId && projectId !== 'all') {
      tasks = tasks.filter(t => t.projectId === projectId);
      milestones = milestones.filter(m => !m.projectId || m.projectId === projectId);
      issues = issues.filter(i => !i.projectId || i.projectId === projectId);
    }

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'Blocked').length;
    const readyForReview = tasks.filter(t => t.status === 'Ready for Review').length;
    const notStartedTasks = tasks.filter(t => t.status === 'Not Started').length;

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdueTasks = tasks.filter(t => {
      if (t.status === 'Completed') return false;
      const due = new Date(t.dueDate);
      return due < now;
    }).length;

    const dueIn7Days = tasks.filter(t => {
      if (t.status === 'Completed') return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= in7Days;
    }).length;

    const activeMilestones = milestones.filter(m => m.status === 'In Progress').length;
    const openIssues = issues.filter(i => i.status === 'Open' || i.status === 'In Progress').length;
    const criticalIssues = issues.filter(i => (i.status === 'Open' || i.status === 'In Progress') && i.severity === 'Critical').length;

    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    let healthStatus: 'ON TRACK' | 'AT RISK' | 'CRITICAL' = 'ON TRACK';
    if (criticalIssues > 0 || overdueTasks >= 3) {
      healthStatus = 'CRITICAL';
    } else if (blockedTasks > 0 || overdueTasks > 0) {
      healthStatus = 'AT RISK';
    }

    let recentActivity = dbData.activity;
    if (projectId && projectId !== 'all') {
      recentActivity = recentActivity.filter(a => !a.projectId || a.projectId === projectId);
    }

    return {
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
      recentActivity: recentActivity.slice(0, 10),
    };
  }
}

export const db = new DatabaseManager();