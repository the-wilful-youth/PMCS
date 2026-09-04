'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function MilestonesPage() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed' | 'delayed'>('all');

  // Sample milestones based on Chronicle_Project_Management_System.xlsx
  const initialMilestones = [
    {
      id: 'MS-001',
      name: 'Project Workspace Setup',
      description: 'Create shared project folders, initialize repository, and establish communication channels',
      owner: 'Anurag',
      targetDate: '2026-08-05',
      status: 'Completed',
      successCriteria: [
        'Repository created with proper access controls',
        'Shared folder structure established',
        'Communication channels (Slack/Email) configured',
        'Initial documentation created'
      ],
      relatedTasks: ['T-001'], // Set up project workspace
      notes: 'Completed ahead of schedule'
    },
    {
      id: 'MS-002',
      name: 'Linux Dataset Selection Complete',
      description: 'Finalize selection of Linux datasets for performance analysis',
      owner: 'Divyanshi',
      targetDate: '2026-08-20',
      status: 'In Progress',
      successCriteria: [
        'Research completed on available Linux performance datasets',
        'Evaluation criteria established and applied',
        'Final dataset selection documented and approved',
        'Access requests submitted for selected datasets'
      ],
      relatedTasks: ['T-002'], // Finalize Linux datasets
      notes: 'Research phase ongoing, evaluation criteria defined'
    },
    {
      id: 'MS-003',
      name: 'Literature Review Completed',
      description: 'Finish comprehensive literature review on Linux performance analysis',
      owner: 'Tanishk',
      targetDate: '2026-08-25',
      status: 'In Progress',
      successCriteria: [
        'Minimum of 20 relevant papers reviewed',
        'Key findings and methodologies documented',
        'Gap analysis completed',
        'Bibliography formatted according to IEEE standards'
      ],
      relatedTasks: ['T-003'], // Literature review
      notes: 'Currently reviewing papers, on track for completion'
    },
    {
      id: 'MS-004',
      name: 'Dataset Acquisition Complete',
      description: 'Download and validate access to all selected datasets',
      owner: 'Prajjwal',
      targetDate: '2026-08-30',
      status: 'Not Started',
      successCriteria: [
        'All selected datasets downloaded and accessible',
        'Data integrity verified through checksum validation',
        'Preprocessing compatibility confirmed',
        'Documentation of acquisition process completed'
      ],
      relatedTasks: ['T-004'], // Dataset acquisition
      notes: 'Pending access approvals from dataset providers'
    },
    {
      id: 'MS-005',
      name: 'Preprocessing Pipeline Operational',
      description: 'Have functional preprocessing pipeline ready for dataset processing',
      owner: 'Anurag',
      targetDate: '2026-09-10',
      status: 'Not Started',
      successCriteria: [
        'Scripts developed for data cleaning and normalization',
        'Pipeline tested with sample data',
        'Performance benchmarks established',
        'Documentation and usage guide completed'
      ],
      relatedTasks: ['T-005'], // Preprocessing pipeline
      notes: 'Waiting for dataset access to begin development'
    }
  ];

  // Sample tasks for progress calculation
  const sampleTasks = [
    { id: 'T-001', title: 'Set up project workspace', status: 'Completed' },
    { id: 'T-002', title: 'Finalize Linux datasets', status: 'In Progress' },
    { id: 'T-003', title: 'Literature review', status: 'In Progress' },
    { id: 'T-004', title: 'Dataset acquisition', status: 'Not Started' },
    { id: 'T-005', title: 'Preprocessing pipeline', status: 'Not Started' }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setMilestones(initialMilestones);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddMilestone = () => {
    router.push('/milestones/new');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading milestones...</p>
      </div>
    );
  }

  const filteredMilestones = milestones.filter(milestone => {
    if (filter === 'all') return true;
    return milestone.status.toLowerCase() === filter ||
           (filter === 'delayed' &&
            new Date(milestone.targetDate) < new Date() &&
            milestone.status !== 'Completed');
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Milestones</h1>
          <div>
            <button
              onClick={handleAddMilestone}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Milestone
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'all' ? '#0d6efd' : 'white',
              color: filter === 'all' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            All ({milestones.length})
          </button>
          <button
            onClick={() => setFilter('not-started')}
            className={filter === 'not-started' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'not-started' ? '#0d6efd' : 'white',
              color: filter === 'not-started' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Not Started ({milestones.filter(m => m.status === 'Not Started').length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={filter === 'in-progress' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'in-progress' ? '#0d6efd' : 'white',
              color: filter === 'in-progress' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            In Progress ({milestones.filter(m => m.status === 'In Progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={filter === 'completed' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'completed' ? '#0d6efd' : 'white',
              color: filter === 'completed' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Completed ({milestones.filter(m => m.status === 'Completed').length})
          </button>
          <button
            onClick={() => setFilter('delayed')}
            className={filter === 'delayed' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'delayed' ? '#0d6efd' : 'white',
              color: filter === 'delayed' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delayed ({milestones.filter(m =>
              new Date(m.targetDate) < new Date() &&
              m.status !== 'Completed'
            ).length})
          </button>
        </div>

        {/* Milestones List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredMilestones.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No milestones found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Milestones
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredMilestones.map((milestone) => (
                <div key={milestone.id} style={{ borderBottom: '1px solid #eee', padding: '2rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        {milestone.name}
                      </h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        {milestone.description}
                      </p>

                      {/* Progress Calculation */}
                      <div style={{ margin: '1rem 0' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#212529', fontWeight: 600 }}>
                          Progress:
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div>
                            {calculateMilestoneProgress(milestone.id, sampleTasks)}%
                            <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                              ({getCompletedRelatedTasks(milestone.id, sampleTasks)}/{getTotalRelatedTasks(milestone.id, sampleTasks)} tasks completed)
                            </span>
                          </div>
                          <div style={{ marginLeft: '1rem', width: '100px', height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${calculateMilestoneProgress(milestone.id, sampleTasks)}%`,
                                backgroundColor: getProgressBarColor(calculateMilestoneProgress(milestone.id, sampleTasks)),
                                borderRadius: '4px'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Success Criteria */}
                      {milestone.successCriteria && milestone.successCriteria.length > 0 && (
                        <div style={{ margin: '1rem 0' }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#212529', fontWeight: 600 }}>
                            Success Criteria:
                          </p>
                          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
                            {milestone.successCriteria.map((criterion: string, index: number) => (
                              <li key={index} style={{ margin: '0.25rem 0', color: '#6c757d', fontSize: '0.85rem' }}>
                                {criterion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Related Tasks */}
                      <div style={{ margin: '1rem 0' }}>
                        <p style={{ margin: '0 0 0.5rem 0', color: '#212529', fontWeight: 600 }}>
                          Related Tasks:
                        </p>
                        {getRelatedTaskNames(milestone.relatedTasks || [], sampleTasks).map((taskName, index) => (
                          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0', borderBottom: '1px solid #f8f9fa' }}>
                            <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                              {taskName}
                            </span>
                            <span
                              style={{
                                backgroundColor: getTaskStatusColor(getTaskStatusById(getTaskIdByName(taskName, sampleTasks), sampleTasks)),
                                color: 'white',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.7rem'
                              }}
                            >
                              {getTaskStatusById(getTaskIdByName(taskName, sampleTasks), sampleTasks)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Metadata */}
                      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        <strong>Owner:</strong> {milestone.owner} |
                        <strong>Target Date:</strong> {milestone.targetDate} |
                        <strong>Status:</strong>
                        <span style={{
                          backgroundColor: getMilestoneStatusColor(milestone.status),
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '3px',
                          fontSize: '0.75rem'
                        }}>
                          {milestone.status}
                        </span>
                      </div>

                      {/* Notes */}
                      {milestone.notes && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                            <strong>Notes:</strong> {milestone.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        <strong>Milestone ID:</strong> {milestone.id}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        <strong>Created:</strong> {getMilestoneCreationDate(milestone.id)}
                      </div>
                      {isMilestoneDelayed(milestone.targetDate, milestone.status) && (
                        <div style={{
                          marginTop: '0.5rem',
                          padding: '0.75rem',
                          backgroundColor: '#f8d7da',
                          border: '1px solid #f5c2c7',
                          borderRadius: '4px'
                        }}>
                          <p style={{ margin: '0', color: '#721c24', fontWeight: 600 }}>
                            ⚠️ OVERDUE
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

// Helper functions for milestone progress calculation
const calculateMilestoneProgress = (milestoneId: string, tasks: any[]): number => {
  const relatedTaskIds = getRelatedTaskIdsByMilestoneId(milestoneId);
  if (relatedTaskIds.length === 0) return 0;

  const completedTasks = tasks.filter(task =>
    relatedTaskIds.includes(task.id) && task.status === 'Completed'
  ).length;

  return Math.round((completedTasks / relatedTaskIds.length) * 100);
};

const getProgressBarColor = (progress: number): string => {
  if (progress >= 100) return '#28a745';
  if (progress >= 50) return '#0d6efd';
  if (progress > 0) return '#ffc107';
  return '#6c757d';
};

const getCompletedRelatedTasks = (milestoneId: string, tasks: any[]): number => {
  const relatedTaskIds = getRelatedTaskIdsByMilestoneId(milestoneId);
  return tasks.filter(task =>
    relatedTaskIds.includes(task.id) && task.status === 'Completed'
  ).length;
};

const getTotalRelatedTasks = (milestoneId: string, tasks: any[]): number => {
  return getRelatedTaskIdsByMilestoneId(milestoneId).length;
};

const getRelatedTaskIdsByMilestoneId = (milestoneId: string): string[] => {
  const milestoneMap: Record<string, string[]> = {
    'MS-001': ['T-001'],
    'MS-002': ['T-002'],
    'MS-003': ['T-003'],
    'MS-004': ['T-004'],
    'MS-005': ['T-005']
  };
  return milestoneMap[milestoneId] || [];
};

const getRelatedTaskNames = (relatedTaskIds: string[], tasks: any[]): string[] => {
  return relatedTaskIds
    .map(id => {
      const task = tasks.find(t => t.id === id);
      return task ? task.title : null;
    })
    .filter((name): name is string => name !== null);
};

const getTaskIdByName = (taskName: string, tasks: any[]): string | null => {
  const task = tasks.find(t => t.title === taskName);
  return task ? task.id : null;
};

const getTaskStatusById = (taskId: string | null, tasks: any[]): string => {
  if (!taskId) return 'Unknown';
  const task = tasks.find(t => t.id === taskId);
  return task ? task.status : 'Unknown';
};

const getTaskStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed': return '#28a745';
    case 'In Progress': return '#ffc107';
    case 'Blocked': return '#dc3545';
    case 'Ready for Review': return '#17a2b8';
    case 'Not Started': return '#6c757d';
    default: return '#6c757d';
  }
};

const getMilestoneStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed': return '#28a745';
    case 'In Progress': return '#ffc107';
    case 'Not Started': return '#6c757d';
    case 'Delayed': return '#dc3545';
    default: return '#6c757d';
  }
};

const isMilestoneDelayed = (targetDate: string, status: string): boolean => {
  if (status === 'Completed') return false;
  return new Date(targetDate) < new Date();
};

const getMilestoneCreationDate = (milestoneId: string): string => {
  // In a real app, this would come from the database
  const dateMap: Record<string, string> = {
    'MS-001': '2026-07-25',
    'MS-002': '2026-07-26',
    'MS-003': '2026-07-27',
    'MS-004': '2026-07-28',
    'MS-005': '2026-07-29'
  };
  return dateMap[milestoneId] || '2026-08-01';
};