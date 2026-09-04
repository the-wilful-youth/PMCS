'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function MyWorkPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchMyTasks = async (user: any) => {
    try {
      const res = await fetch(`/api/tasks?assignee=${user?.name || user?.username || 'Anurag'}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch my tasks:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      const user = getCurrentUser();
      setCurrentUser(user);
      fetchMyTasks(user).finally(() => setIsLoading(false));
    }
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading your assigned tasks...</p>
      </div>
    );
  }

  const today = new Date();
  const oneWeekFromToday = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeTasks = tasks.filter(task => task.status === 'In Progress');
  const dueThisWeek = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate >= today && taskDate <= oneWeekFromToday && task.status !== 'Completed';
  });
  const overdue = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    return taskDate < today && task.status !== 'Completed';
  });
  const blocked = tasks.filter(task => task.status === 'Blocked');
  const readyForReview = tasks.filter(task => task.status === 'Ready for Review');
  const completed = tasks.filter(task => task.status === 'Completed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#28a745';
      case 'In Progress': return '#ffc107';
      case 'Blocked': return '#dc3545';
      case 'Ready for Review': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>My Work</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Personal workspace for {currentUser?.name || 'Member'}
            </p>
          </div>
          <div>
            <button
              onClick={() => router.push('/tasks')}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              View All Project Tasks →
            </button>
          </div>
        </div>

        {/* My Work Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.85rem' }}>In Progress</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#ffc107' }}>
              {activeTasks.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.85rem' }}>Due This Week</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#0d6efd' }}>
              {dueThisWeek.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.85rem' }}>Overdue</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#dc3545' }}>
              {overdue.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.85rem' }}>Blocked</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#dc3545' }}>
              {blocked.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.85rem' }}>Ready for Review</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#17a2b8' }}>
              {readyForReview.length}
            </p>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#495057', fontSize: '0.85rem' }}>Completed</h3>
            <p style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: '#28a745' }}>
              {completed.length}
            </p>
          </div>
        </div>

        {/* Task Cards */}
        <div style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f3f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#212529' }}>Assigned Deliverables ({tasks.length})</h2>
          </div>

          {tasks.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No tasks currently assigned to you.</p>
            </div>
          ) : (
            <div>
              {tasks.map((task, idx) => (
                <div
                  key={task.id}
                  style={{
                    borderBottom: idx < tasks.length - 1 ? '1px solid #f1f3f5' : 'none',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d6efd', backgroundColor: '#e7f1ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {task.id}
                      </span>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{task.title}</h4>
                    </div>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: '#6c757d' }}>{task.description}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ backgroundColor: getStatusColor(task.status), color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {task.status}
                      </span>
                      <span style={{ fontSize: '0.825rem', color: '#6c757d' }}>Due: <strong>{task.dueDate}</strong></span>
                      <span style={{ fontSize: '0.825rem', color: '#6c757d' }}>Effort: {task.actualEffort || '0h'} / {task.estimatedEffort}</span>
                    </div>
                  </div>

                  <div>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        fontSize: '0.825rem',
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Ready for Review">Ready for Review</option>
                      <option value="Completed">Completed</option>
                      <option value="Blocked">Blocked</option>
                    </select>
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