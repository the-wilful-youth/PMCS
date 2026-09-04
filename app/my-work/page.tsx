'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function MyWorkPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample tasks based on Chronicle_Project_Management_System.xlsx
  const initialTasks = [
    {
      id: 'T-001',
      title: 'Set up project workspace',
      description: 'Create shared project folders and tracker',
      status: 'In Progress',
      priority: 'Medium',
      assignee: 'Anurag',
      dueDate: '2026-09-15',
      createdAt: '2026-09-01'
    },
    {
      id: 'T-002',
      title: 'Finalize Linux datasets',
      description: 'Select final datasets for Chronicle',
      status: 'Not Started',
      priority: 'High',
      assignee: 'Divyanshi',
      dueDate: '2026-09-20',
      createdAt: '2026-09-01'
    },
    {
      id: 'T-003',
      title: 'Literature review',
      description: 'Collect and summarize relevant papers',
      status: 'Ready for Review',
      priority: 'Medium',
      assignee: 'Tanishk',
      dueDate: '2026-09-25',
      createdAt: '2026-09-01'
    },
    {
      id: 'T-004',
      title: 'Dataset acquisition',
      description: 'Download/request access to selected datasets',
      status: 'Blocked',
      priority: 'High',
      assignee: 'Prajjwal',
      dueDate: '2026-09-30',
      createdAt: '2026-09-01'
    },
    {
      id: 'T-005',
      title: 'Preprocessing pipeline',
      description: 'Prepare scripts for cleaning and preprocessing',
      status: 'Completed',
      priority: 'Medium',
      assignee: 'Anurag',
      dueDate: '2026-10-05',
      createdAt: '2026-09-01'
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setTasks(initialTasks);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading your work...</p>
      </div>
    );
  }

  // Calculate metrics for My Work
  const today = new Date();
  const oneWeekFromToday = new Date();
  oneWeekFromToday.setDate(today.getDate() + 7);

  const myTasks = tasks.filter(task => task.assignee === (typeof window !== 'undefined' ? window.localStorage.getItem('userName')?.split(' ')[0] || 'Anurag' : 'Anurag'));
  const activeTasks = myTasks.filter(task => task.status === 'In Progress');
  const dueToday = myTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today.toDateString() && task.status !== 'Completed';
  });
  const dueThisWeek = myTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= today && taskDate <= oneWeekFromToday && task.status !== 'Completed';
  });
  const overdue = myTasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate < today && task.status !== 'Completed';
  });
  const blocked = myTasks.filter(task => task.status === 'Blocked');
  const readyForReview = myTasks.filter(task => task.status === 'Ready for Review');
  const recentlyCompleted = myTasks.filter(task => task.status === 'Completed').slice(0, 5); // Show last 5 completed

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>My Work</h1>
          <div>
            <button
              onClick={() => router.push('/tasks')}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              View All Tasks
            </button>
          </div>
        </div>

        {/* My Work Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '0.9rem' }}>Active Tasks</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#0d6efd' }}>
              {activeTasks.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '0.9rem' }}>Due Today</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#fd7e14' }}>
              {dueToday.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '0.9rem' }}>Due This Week</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#0d6efd' }}>
              {dueThisWeek.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '0.9rem' }}>Overdue</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#dc3545' }}>
              {overdue.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '0.9rem' }}>Blocked</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#ffc107' }}>
              {blocked.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontSize: '0.9rem' }}>Ready for Review</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#20c997' }}>
              {readyForReview.length}
            </p>
          </div>
        </div>

        {/* Recently Completed Tasks */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '1.5rem' }}>
            <h2 style={{ color: '#212529', marginTop: 0 }}>Recently Completed</h2>
            {recentlyCompleted.length === 0 ? (
              <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
                No recently completed tasks
              </p>
            ) : (
              <div>
                {recentlyCompleted.map((task) => (
                  <div key={task.id} style={{ borderBottom: '1px solid #eee', padding: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                          {task.title}
                        </h4>
                        <p style={{ margin: 0, color: '#6c757d', fontSize: '0.875rem' }}>
                          {task.description}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem'
                          }}
                        >
                          Completed
                        </span>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6c757d' }}>
                          Completed: {task.createdAt}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Tasks List */}
        <div style={{ marginTop: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{ color: '#212529', marginTop: 0 }}>My Active Tasks</h2>
              {activeTasks.length === 0 ? (
                <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
                  No active tasks
                </p>
              ) : (
                <div>
                  {activeTasks.map((task) => (
                    <div key={task.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                            {task.title}
                          </h4>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                            {task.description}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                backgroundColor: getStatusColor(task.status),
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              {task.status}
                            </span>
                            <span
                              style={{
                                backgroundColor: getPriorityColor(task.priority),
                                color: 'white',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '3px',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}
                            >
                              {task.priority}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                              Assigned to: {task.assignee}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                            Due: {task.dueDate}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                            Created: {task.createdAt}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper functions for status and priority colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return '#28a745';
    case 'In Progress': return '#ffc107';
    case 'Blocked': return '#dc3545';
    case 'Ready for Review': return '#17a2b8';
    case 'Not Started': return '#6c757d';
    default: return '#6c757d';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return '#dc3545';
    case 'Medium': return '#ffc107';
    case 'Low': return '#28a745';
    default: return '#6c757d';
  }
};