'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function ActivityPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'project' | 'member' | 'task' | 'document' | 'research' | 'dataset' | 'meeting' | 'milestone' | 'issue'>('all');

  // Sample activities based on project data
  const sampleActivities = [
    {
      id: 'A-001',
      user: 'Anurag',
      action: 'Project Created',
      object: 'Chronicle Linux Performance Analysis Project',
      timestamp: '2026-08-01 09:00:00'
    },
    {
      id: 'A-002',
      user: 'Anurag',
      action: 'Member Added',
      object: 'Divyanshi (Role: Team Member)',
      timestamp: '2026-08-01 09:15:00'
    },
    {
      id: 'A-003',
      user: 'Anurag',
      action: 'Member Added',
      object: 'Tanishk (Role: Team Member)',
      timestamp: '2026-08-01 09:20:00'
    },
    {
      id: 'A-004',
      user: 'Anurag',
      action: 'Member Added',
      object: 'Prajjwal (Role: Team Member)',
      timestamp: '2026-08-01 09:25:00'
    },
    {
      id: 'A-005',
      user: 'Anurag',
      action: 'Task Created',
      object: 'T-001: Set up project workspace',
      timestamp: '2026-08-01 10:00:00'
    },
    {
      id: 'A-006',
      user: 'Anurag',
      action: 'Task Created',
      object: 'T-002: Finalize Linux datasets',
      timestamp: '2026-08-01 10:05:00'
    },
    {
      id: 'A-007',
      user: 'Anurag',
      action: 'Task Created',
      object: 'T-003: Literature review',
      timestamp: '2026-08-01 10:10:00'
    },
    {
      id: 'A-008',
      user: 'Anurag',
      action: 'Task Created',
      object: 'T-004: Dataset acquisition',
      timestamp: '2026-08-01 10:15:00'
    },
    {
      id: 'A-009',
      user: 'Anurag',
      action: 'Task Created',
      object: 'T-005: Preprocessing pipeline',
      timestamp: '2026-08-01 10:20:00'
    },
    {
      id: 'A-010',
      user: 'Anurag',
      action: 'Task Assigned',
      object: 'T-001 assigned to Anurag',
      timestamp: '2026-08-01 10:30:00'
    },
    {
      id: 'A-011',
      user: 'Anurag',
      action: 'Task Assigned',
      object: 'T-002 assigned to Divyanshi',
      timestamp: '2026-08-01 10:35:00'
    },
    {
      id: 'A-012',
      user: 'Anurag',
      action: 'Task Assigned',
      object: 'T-003 assigned to Tanishk',
      timestamp: '2026-08-01 10:40:00'
    },
    {
      id: 'A-013',
      user: 'Anurag',
      action: 'Task Assigned',
      object: 'T-004 assigned to Prajjwal',
      timestamp: '2026-08-01 10:45:00'
    },
    {
      id: 'A-014',
      user: 'Anurag',
      action: 'Task Assigned',
      object: 'T-005 assigned to Anurag',
      timestamp: '2026-08-01 10:50:00'
    },
    {
      id: 'A-015',
      user: 'Anurag',
      action: 'Task Status Changed',
      object: 'T-001: Not Started → In Progress',
      timestamp: '2026-08-02 14:30:00'
    },
    {
      id: 'A-016',
      user: 'Divyanshi',
      action: 'Document Added',
      object: 'Project Charter (Category: Project Planning)',
      timestamp: '2026-08-03 11:00:00'
    },
    {
      id: 'A-017',
      user: 'Tanishk',
      action: 'Research Added',
      object: 'A Survey of Linux Kernel Performance Analysis Tools',
      timestamp: '2026-08-04 09:00:00'
    },
    {
      id: 'A-018',
      user: 'Prajjwal',
      action: 'Dataset Added',
      object: 'Linux Kernel Performance Traces',
      timestamp: '2026-08-05 10:00:00'
    },
    {
      id: 'A-019',
      user: 'Anurag',
      action: 'Meeting Scheduled',
      object: 'Project Kickoff Meeting (2026-08-01)',
      timestamp: '2026-08-01 08:00:00'
    },
    {
      id: 'A-020',
      user: 'Anurag',
      action: 'Milestone Created',
      object: 'MS-001: Project Workspace Setup',
      timestamp: '2026-07-25 16:00:00'
    },
    {
      id: 'A-021',
      user: 'Anurag',
      action: 'Issue Reported',
      object: 'I-001: Insufficient storage space for large datasets',
      timestamp: '2026-08-15 10:30:00'
    },
    {
      id: 'A-022',
      user: 'Anurag',
      action: 'Task Status Changed',
      object: 'T-001: In Progress → Completed',
      timestamp: '2026-08-10 09:00:00'
    },
    {
      id: 'A-022',
      user: 'Anurag',
      action: 'Milestone Completed',
      object: 'MS-001: Project Workspace Setup',
      timestamp: '2026-08-05 14:00:00'
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setActivities(sampleActivities);
      setIsLoading(false);

      fetch('/api/activity')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.activity && data.activity.length > 0) {
            const mapped = data.activity.map((a: any) => ({
              id: a.id,
              user: a.userName,
              action: a.actionType.replace(/_/g, ' ').toUpperCase(),
              object: a.description,
              timestamp: a.timestamp.replace('T', ' ').substring(0, 19),
            }));
            setActivities(mapped);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading activity log...</p>
      </div>
    );
  }

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    const activityType = getActivityType(activity.action);
    return activityType === filter;
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Activity Log</h1>
          <div>
            <button
              onClick={() => alert('Export functionality would be implemented here')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Export Log
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
            All ({activities.length})
          </button>
          <button
            onClick={() => setFilter('project')}
            className={filter === 'project' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'project' ? '#0d6efd' : 'white',
              color: filter === 'project' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Project ({activities.filter(a => getActivityType(a.action) === 'project').length})
          </button>
          <button
            onClick={() => setFilter('member')}
            className={filter === 'member' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'member' ? '#0d6efd' : 'white',
              color: filter === 'member' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Member ({activities.filter(a => getActivityType(a.action) === 'member').length})
          </button>
          <button
            onClick={() => setFilter('task')}
            className={filter === 'task' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'task' ? '#0d6efd' : 'white',
              color: filter === 'task' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Task ({activities.filter(a => getActivityType(a.action) === 'task').length})
          </button>
          <button
            onClick={() => setFilter('document')}
            className={filter === 'document' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'document' ? '#0d6efd' : 'white',
              color: filter === 'document' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Document ({activities.filter(a => getActivityType(a.action) === 'document').length})
          </button>
          <button
            onClick={() => setFilter('research')}
            className={filter === 'research' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'research' ? '#0d6efd' : 'white',
              color: filter === 'research' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Research ({activities.filter(a => getActivityType(a.action) === 'research').length})
          </button>
          <button
            onClick={() => setFilter('dataset')}
            className={filter === 'dataset' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'dataset' ? '#0d6efd' : 'white',
              color: filter === 'dataset' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dataset ({activities.filter(a => getActivityType(a.action) === 'dataset').length})
          </button>
          <button
            onClick={() => setFilter('meeting')}
            className={filter === 'meeting' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'meeting' ? '#0d6efd' : 'white',
              color: filter === 'meeting' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Meeting ({activities.filter(a => getActivityType(a.action) === 'meeting').length})
          </button>
          <button
            onClick={() => setFilter('milestone')}
            className={filter === 'milestone' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'milestone' ? '#0d6efd' : 'white',
              color: filter === 'milestone' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Milestone ({activities.filter(a => getActivityType(a.action) === 'milestone').length})
          </button>
          <button
            onClick={() => setFilter('issue')}
            className={filter === 'issue' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'issue' ? '#0d6efd' : 'white',
              color: filter === 'issue' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Issue ({activities.filter(a => getActivityType(a.action) === 'issue').length})
          </button>
        </div>

        {/* Activity List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredActivities.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No activity found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Activity
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredActivities.map((activity) => (
                <div key={activity.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 0.25rem 0', color: '#212529', fontWeight: 600 }}>
                        {activity.action}
                      </p>
                      <p style={{ margin: '0', color: '#6c757d', fontSize: '0.875rem' }}>
                        {activity.object}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '150px' }}>
                      <p style={{ margin: '0', color: '#6c757d', fontSize: '0.875rem' }}>
                        {activity.timestamp}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        By: {activity.user}
                      </div>
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

// Helper function to categorize activity type
const getActivityType = (action: string): string => {
  if (action === 'Project Created') return 'project';
  if (action.includes('Member Added') || action.includes('Member Removed')) return 'member';
  if (
    action.includes('Task Created') ||
    action.includes('Task Assigned') ||
    action.includes('Task Status Changed')
  ) return 'task';
  if (action.includes('Document Added') || action.includes('Document Updated')) return 'document';
  if (action.includes('Research Added')) return 'research';
  if (action.includes('Dataset Added')) return 'dataset';
  if (action.includes('Meeting Scheduled') || action.includes('Meeting Conducted')) return 'meeting';
  if (action.includes('Milestone Created') || action.includes('Milestone Completed')) return 'milestone';
  if (action.includes('Issue Reported') || action.includes('Issue Resolved')) return 'issue';
  return 'other';
};