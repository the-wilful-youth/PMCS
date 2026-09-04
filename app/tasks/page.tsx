'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
  createdAt: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done' | 'blocked'>('all');

  // Sample tasks based on Chronicle_Project_Management_System.xlsx
  const initialTasks = [
    {
      id: 'T-001',
      title: 'Set up project workspace',
      description: 'Create shared project folders and tracker',
      status: 'Not Started',
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
      status: 'Not Started',
      priority: 'Medium',
      assignee: 'Tanishk',
      dueDate: '2026-09-25',
      createdAt: '2026-09-01'
    },
    {
      id: 'T-004',
      title: 'Dataset acquisition',
      description: 'Download/request access to selected datasets',
      status: 'Not Started',
      priority: 'High',
      assignee: 'Prajjwal',
      dueDate: '2026-09-30',
      createdAt: '2026-09-01'
    },
    {
      id: 'T-005',
      title: 'Preprocessing pipeline',
      description: 'Prepare scripts for cleaning and preprocessing',
      status: 'Not Started',
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

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'todo') return task.status === 'Not Started';
    if (filter === 'in-progress') return task.status === 'In Progress';
    if (filter === 'done') return task.status === 'Completed';
    if (filter === 'blocked') return task.status === 'Blocked';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#28a745';
      case 'In Progress': return '#ffc107';
      case 'Blocked': return '#dc3545';
      case 'Ready for Review': return '#17a2b8';
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

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0}}>Task Management</h1>
          <div>
            <button
              onClick={() => router.push('/tasks/new')}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              New Task
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
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
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('todo')}
            className={filter === 'todo' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'todo' ? '#0d6efd' : 'white',
              color: filter === 'todo' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            To Do ({tasks.filter(t => t.status === 'Not Started').length})
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
            In Progress ({tasks.filter(t => t.status === 'In Progress').length})
          </button>
          <button
            onClick={() => setFilter('done')}
            className={filter === 'done' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'done' ? '#0d6efd' : 'white',
              color: filter === 'done' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Completed ({tasks.filter(t => t.status === 'Completed').length})
          </button>
          <button
            onClick={() => setFilter('blocked')}
            className={filter === 'blocked' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'blocked' ? '#0d6efd' : 'white',
              color: filter === 'blocked' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Blocked ({tasks.filter(t => t.status === 'Blocked').length})
          </button>
        </div>

        {/* Tasks List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No tasks found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Tasks
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredTasks.map((task) => (
                <div key={task.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        {task.title}
                      </h3>
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
    </main>
  );
}