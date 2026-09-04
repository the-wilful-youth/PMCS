'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, logout } from '@/lib/auth';

// Mock data based on Chronicle_Project_Management_System.xlsx
const mockDashboardData = {
  overallCompletion: 35, // 35% complete based on sample tasks
  totalTasks: 5,
  completedTasks: 0,
  inProgressTasks: 0,
  blockedTasks: 0,
  readyForReview: 0,
  overdueTasks: 0,
  dueIn7Days: 2, // Based on sample tasks timeline
  healthStatus: 'ON TRACK' // Would be calculated based on actual data
};

const mockTasks = [
  { id: 'T-001', title: 'Set up project workspace', description: 'Create shared project folders and tracker', status: 'Not Started' },
  { id: 'T-002', title: 'Finalize Linux datasets', description: 'Select final datasets for Chronicle', status: 'Not Started' },
  { id: 'T-003', title: 'Literature review', description: 'Collect and summarize relevant papers', status: 'Not Started' },
  { id: 'T-004', title: 'Dataset acquisition', description: 'Download/request access to selected datasets', status: 'Not Started' },
  { id: 'T-005', title: 'Preprocessing pipeline', description: 'Prepare scripts for cleaning and preprocessing', status: 'Not Started' }
];

const mockTeam = [
  { id: 'u-1', name: 'Anurag', role: 'admin' },
  { id: 'u-2', name: 'Divyanshi', role: 'member' },
  { id: 'u-3', name: 'Tanishk', role: 'member' },
  { id: 'u-4', name: 'Prajjwal', role: 'member' }
];

export function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(mockDashboardData);
  const [tasks, setTasks] = useState(mockTasks);
  const [team, setTeam] = useState(mockTeam);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      setIsLoading(false);

      const fetchDashboardData = (projId?: string) => {
        const activeId = projId !== undefined 
          ? projId 
          : (typeof window !== 'undefined' ? window.localStorage.getItem('pmcs_active_project_id') || 'all' : 'all');
        const url = activeId && activeId !== 'all' ? `/api/dashboard?projectId=${encodeURIComponent(activeId)}` : '/api/dashboard';

        if (typeof fetch !== 'undefined') {
          fetch(url)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && data.metrics) {
                setDashboardData({
                  overallCompletion: data.metrics.overallCompletion,
                  totalTasks: data.metrics.totalTasks,
                  completedTasks: data.metrics.completedTasks,
                  inProgressTasks: data.metrics.inProgressTasks,
                  blockedTasks: data.metrics.blockedTasks,
                  readyForReview: data.metrics.readyForReview,
                  overdueTasks: data.metrics.overdueTasks,
                  dueIn7Days: data.metrics.dueIn7Days,
                  healthStatus: data.metrics.healthStatus,
                });
                if (data.tasks) {
                  setTasks(data.tasks);
                }
                if (data.team) {
                  setTeam(data.team);
                }
              }
            })
            .catch(() => {
              // Fallback to initial seed state
            });
        }
      };

      fetchDashboardData();

      const handleProjectChange = (e: Event) => {
        const customEvent = e as CustomEvent;
        fetchDashboardData(customEvent.detail?.projectId);
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('pmcs-project-changed', handleProjectChange);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('pmcs-project-changed', handleProjectChange);
        }
      };
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  // Calculate completion percentage based on tasks
  const calculateCompletion = (tasksArray: any[]) => {
    if (tasksArray.length === 0) return 0;
    const completed = tasksArray.filter(task => task.status === 'Completed').length;
    return Math.round((completed / tasksArray.length) * 100);
  };

  if (isLoading) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#495057',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '2.5rem',
            height: '2.5rem',
            border: '3px solid #dee2e6',
            borderTopColor: '#0d6efd',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>Verifying session...</p>
        </div>
      </main>
    );
  }

  // Recalculate completion based on current tasks
  const completionPercentage = calculateCompletion(tasks);

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#212529',
      padding: '2rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e9ecef',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #dee2e6',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0d6efd',
              letterSpacing: '-0.02em'
            }}>
              Project Manager Portal
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
              Centralized Academic & Software Project Operating Workspace
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {currentUser?.name || 'Authorized Member'}
              </div>
              <span style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: currentUser?.role === 'admin' ? '#cff4fc' : '#e2e3e5',
                color: currentUser?.role === 'admin' ? '#055160' : '#383d41'
              }}>
                {currentUser?.role === 'admin' ? 'Project Admin' : 'Team Member'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#dc3545',
                backgroundColor: '#fff',
                border: '1px solid #dc3545',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#dc3545';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#dc3545';
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <section style={{ padding: '2rem' }}>
          {/* Dashboard Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', color: '#212529' }}>
              Project Dashboard
            </h2>
            <p style={{ margin: 0, fontSize: '0.95rem', color: '#6c757d' }}>
              Real-time overview of project health and progress
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Overall Completion */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '10px',
              border: '1px solid #dee2e6',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#6c757d', fontWeight: 600 }}>
                Overall Completion
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>
                {completionPercentage}%
              </div>
              <div style={{ fontSize: '0.85rem', color: '#28a745', fontWeight: 600 }}>
                {tasks.filter(t => t.status === 'Completed').length}/{tasks.length} tasks completed
              </div>
            </div>

            {/* Total Tasks */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#e7f1ff',
              borderRadius: '10px',
              border: '1px solid #b6d4fe',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#084298', fontWeight: 600 }}>
                Total Tasks
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {tasks.length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                All project tasks
              </div>
            </div>

            {/* In Progress */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fff4e6',
              borderRadius: '10px',
              border: '1px solid #ffeaa7',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#d35400', fontWeight: 600 }}>
                In Progress
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {tasks.filter(t => t.status === 'In Progress').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                Currently active work
              </div>
            </div>

            {/* Blocked */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fdedec',
              borderRadius: '10px',
              border: '1px solid #f5b7b1',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#922b21', fontWeight: 600 }}>
                Blocked
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {tasks.filter(t => t.status === 'Blocked').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                Issues requiring attention
              </div>
            </div>

            {/* Ready for Review */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#e8f8f5',
              borderRadius: '10px',
              border: '1px solid #aed6f1',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#117a65', fontWeight: 600 }}>
                Ready for Review
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {tasks.filter(t => t.status === 'Ready for Review').length}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                Awaiting feedback/approval
              </div>
            </div>

            {/* Overdue & Due Soon */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#fdecea',
              borderRadius: '10px',
              border: '1px solid #f5b7ac',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#922b21', fontWeight: 600 }}>
                Attention Needed
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0' }}>
                {dashboardData.overdueTasks + dashboardData.dueIn7Days}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                {dashboardData.overdueTasks} overdue • {dashboardData.dueIn7Days} due in 7 days
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem',
            backgroundColor: '#d4efdf',
            borderRadius: '10px',
            border: '1px solid #a8dadc'
          }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem', color: '#1e8449' }}>
                Project Health Status
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e8449' }}>
                {dashboardData.healthStatus}
              </p>
            </div>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1e8449',
              color: 'white',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}>
              View Detailed Report
            </div>
          </div>

          {/* Recent Activity */}
          <div style={{ marginTop: '2.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#212529' }}>
              Recent Activity
            </h3>
            <div style={{
              border: '1px solid #eee',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {tasks.map((task, index) => (
                <div key={task.id} style={{
                  padding: '1rem',
                  borderBottom: index < tasks.length - 1 ? '1px solid #eee' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
                      {task.title}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d' }}>
                      {task.description}
                    </p>
                  </div>
                  <div style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor:
                      task.status === 'Completed' ? '#d4edda' :
                      task.status === 'In Progress' ? '#fff3cd' :
                      task.status === 'Blocked' ? '#f8d7da' :
                      task.status === 'Ready for Review' ? '#d1ecf1' :
                      '#f8f9fa',
                    color:
                      task.status === 'Completed' ? '#155724' :
                      task.status === 'In Progress' ? '#856404' :
                      task.status === 'Blocked' ? '#721c24' :
                      task.status === 'Ready for Review' ? '#0c5460' :
                      '#6c757d',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    fontWeight: 600
                  }}>
                    {task.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomePage;