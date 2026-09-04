'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function MilestonesPage() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed' | 'delayed'>('all');

  // Add Milestone Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    name: '',
    description: '',
    owner: 'Anurag',
    targetDate: '',
    status: 'Not Started',
    successCriteriaText: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      const [msRes, tasksRes, usersRes] = await Promise.all([
        fetch('/api/milestones'),
        fetch('/api/tasks'),
        fetch('/api/auth/users'),
      ]);

      if (msRes.ok) {
        const msData = await msRes.json();
        setMilestones(msData.milestones);
      }
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTeamMembers(usersData.users);
      }
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      loadData().finally(() => setIsLoading(false));
    }
  }, []);

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestone.name.trim()) return;

    setIsSubmitting(true);
    try {
      const criteria = newMilestone.successCriteriaText
        .split('\n')
        .map(c => c.trim())
        .filter(Boolean);

      const res = await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMilestone.name,
          description: newMilestone.description,
          owner: newMilestone.owner,
          targetDate: newMilestone.targetDate,
          status: newMilestone.status,
          successCriteria: criteria,
          notes: newMilestone.notes,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewMilestone({
          name: '',
          description: '',
          owner: teamMembers[0]?.name || 'Anurag',
          targetDate: '',
          status: 'Not Started',
          successCriteriaText: '',
          notes: '',
        });
        await loadData();
      }
    } catch (err) {
      console.error('Failed to create milestone:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (milestoneId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setMilestones(prev => prev.map(m => m.id === milestoneId ? { ...m, status: newStatus } : m));
      }
    } catch (err) {
      console.error('Failed to update milestone status:', err);
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    if (!confirm(`Are you sure you want to delete milestone ${id}?`)) return;
    try {
      const res = await fetch(`/api/milestones/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMilestones(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete milestone:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading milestones from database...</p>
      </div>
    );
  }

  const filteredMilestones = milestones.filter(milestone => {
    if (filter === 'all') return true;
    if (filter === 'delayed') {
      return new Date(milestone.targetDate) < new Date() && milestone.status !== 'Completed';
    }
    return milestone.status.toLowerCase().replace(' ', '-') === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#28a745';
      case 'In Progress': return '#ffc107';
      case 'Delayed': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Project Milestones</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Strategic delivery checkpoints and stage-gate reviews
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#0d6efd',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(13,110,253,0.2)',
            }}
          >
            + Add Milestone
          </button>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'all' ? '#0d6efd' : 'white',
              color: filter === 'all' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            All ({milestones.length})
          </button>
          <button
            onClick={() => setFilter('not-started')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'not-started' ? '#0d6efd' : 'white',
              color: filter === 'not-started' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Not Started ({milestones.filter(m => m.status === 'Not Started').length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'in-progress' ? '#0d6efd' : 'white',
              color: filter === 'in-progress' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            In Progress ({milestones.filter(m => m.status === 'In Progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'completed' ? '#0d6efd' : 'white',
              color: filter === 'completed' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Completed ({milestones.filter(m => m.status === 'Completed').length})
          </button>
          <button
            onClick={() => setFilter('delayed')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'delayed' ? '#0d6efd' : 'white',
              color: filter === 'delayed' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Delayed ({milestones.filter(m => new Date(m.targetDate) < new Date() && m.status !== 'Completed').length})
          </button>
        </div>

        {/* Milestone Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredMilestones.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '10px', textAlign: 'center', color: '#6c757d', border: '1px solid #dee2e6' }}>
              <p>No milestones match this filter.</p>
            </div>
          ) : (
            filteredMilestones.map(ms => {
              const relatedTaskList = tasks.filter(t => ms.relatedTasks?.includes(t.id));
              const completedTasksCount = relatedTaskList.filter(t => t.status === 'Completed').length;
              const progressPct = relatedTaskList.length > 0 ? Math.round((completedTasksCount / relatedTaskList.length) * 100) : (ms.status === 'Completed' ? 100 : 0);

              return (
                <div key={ms.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d6efd', backgroundColor: '#e7f1ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                          {ms.id}
                        </span>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#212529' }}>{ms.name}</h3>
                      </div>
                      <p style={{ margin: '0 0 0.5rem', color: '#6c757d', fontSize: '0.9rem' }}>{ms.description}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <select
                        value={ms.status}
                        onChange={(e) => handleStatusChange(ms.id, e.target.value)}
                        style={{
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.825rem',
                          borderRadius: '6px',
                          border: '1px solid #ced4da',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Delayed">Delayed</option>
                      </select>

                      {currentUser?.role === 'admin' && (
                        <button
                          onClick={() => handleDeleteMilestone(ms.id)}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#dc3545',
                            border: '1px solid #f5c2c7',
                            padding: '0.3rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ margin: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                      <span>Progress: {progressPct}%</span>
                      <span>Target Date: <strong>{ms.targetDate}</strong></span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#e9ecef', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progressPct}%`, height: '100%', backgroundColor: ms.status === 'Completed' ? '#28a745' : '#0d6efd', transition: 'width 0.3s ease' }} />
                    </div>
                  </div>

                  {/* Success Criteria */}
                  {ms.successCriteria && ms.successCriteria.length > 0 && (
                    <div style={{ marginTop: '0.75rem', backgroundColor: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#495057', marginBottom: '0.25rem' }}>Success Criteria:</div>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.825rem', color: '#6c757d' }}>
                        {ms.successCriteria.map((c: string, idx: number) => (
                          <li key={idx}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '1rem',
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '2rem',
              maxWidth: '550px',
              width: '100%',
            }}>
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem' }}>Add Milestone</h2>
              <form onSubmit={handleCreateMilestone}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Name *</label>
                  <input
                    type="text"
                    required
                    value={newMilestone.name}
                    onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                    placeholder="e.g. Pipeline Verification"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea
                    rows={2}
                    value={newMilestone.description}
                    onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Owner</label>
                    <select
                      value={newMilestone.owner}
                      onChange={(e) => setNewMilestone({ ...newMilestone, owner: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    >
                      {teamMembers.map(m => (
                        <option key={m.username} value={m.name}>{m.name}</option>
                      ))}
                      {teamMembers.length === 0 && <option value="Anurag">Anurag</option>}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Target Date</label>
                    <input
                      type="date"
                      value={newMilestone.targetDate}
                      onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Success Criteria (one per line)
                  </label>
                  <textarea
                    rows={3}
                    value={newMilestone.successCriteriaText}
                    onChange={(e) => setNewMilestone({ ...newMilestone, successCriteriaText: e.target.value })}
                    placeholder="Tests pass with 100%&#10;Documentation published"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ padding: '0.5rem 1rem', border: '1px solid #ced4da', backgroundColor: '#f8f9fa', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{ padding: '0.5rem 1.25rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Milestone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}