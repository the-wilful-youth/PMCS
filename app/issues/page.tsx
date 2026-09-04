'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved' | 'critical'>('all');

  // Report Issue Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newIssue, setNewIssue] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    priority: 'Medium',
    assignedTo: 'Anurag',
  });

  const loadData = async () => {
    try {
      const [issRes, usersRes] = await Promise.all([
        fetch('/api/issues'),
        fetch('/api/auth/users'),
      ]);
      if (issRes.ok) {
        const issData = await issRes.json();
        setIssues(issData.issues);
      }
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setTeamMembers(usersData.users);
      }
    } catch (err) {
      console.error('Failed to load issues:', err);
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

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssue.title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssue),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewIssue({
          title: '',
          description: '',
          severity: 'Medium',
          priority: 'Medium',
          assignedTo: teamMembers[0]?.name || 'Anurag',
        });
        await loadData();
      }
    } catch (err) {
      console.error('Failed to create issue:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    let resolution = undefined;
    if (newStatus === 'Resolved') {
      resolution = prompt('Enter resolution summary:') || 'Resolved';
    }

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resolution }),
      });
      if (res.ok) {
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus, resolution: resolution || i.resolution } : i));
      }
    } catch (err) {
      console.error('Failed to update issue status:', err);
    }
  };

  const handleDeleteIssue = async (id: string) => {
    if (!confirm(`Are you sure you want to delete issue ${id}?`)) return;
    try {
      const res = await fetch(`/api/issues/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setIssues(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete issue:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading issues and blockers...</p>
      </div>
    );
  }

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'critical') return issue.severity === 'Critical';
    return issue.status.toLowerCase().replace(' ', '-') === filter;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#dc3545';
      case 'High': return '#fd7e14';
      case 'Medium': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Issues & Blockers</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Track risks, dependencies, impediments, and resolutions
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: '0 2px 4px rgba(220,53,69,0.2)',
            }}
          >
            + Report Issue
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
            All ({issues.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'open' ? '#0d6efd' : 'white',
              color: filter === 'open' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Open ({issues.filter(i => i.status === 'Open').length})
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
            In Progress ({issues.filter(i => i.status === 'In Progress').length})
          </button>
          <button
            onClick={() => setFilter('critical')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'critical' ? '#dc3545' : 'white',
              color: filter === 'critical' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Critical ({issues.filter(i => i.severity === 'Critical').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'resolved' ? '#28a745' : 'white',
              color: filter === 'resolved' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Resolved ({issues.filter(i => i.status === 'Resolved' || i.status === 'Closed').length})
          </button>
        </div>

        {/* Issue Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredIssues.length === 0 ? (
            <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '10px', textAlign: 'center', color: '#6c757d', border: '1px solid #dee2e6' }}>
              <p>No issues found for this filter.</p>
            </div>
          ) : (
            filteredIssues.map(issue => (
              <div key={issue.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.25rem 1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc3545', backgroundColor: '#f8d7da', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {issue.id}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#212529' }}>{issue.title}</h3>
                    </div>
                    <p style={{ margin: '0 0 0.75rem', color: '#6c757d', fontSize: '0.9rem' }}>{issue.description}</p>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ backgroundColor: getSeverityColor(issue.severity), color: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                        {issue.severity} Severity
                      </span>
                      <span style={{ fontSize: '0.825rem', color: '#495057' }}>
                        Reported by: <strong>{issue.reportedBy}</strong>
                      </span>
                      <span style={{ fontSize: '0.825rem', color: '#495057' }}>
                        Assigned to: <strong>{issue.assignedTo}</strong>
                      </span>
                      <span style={{ fontSize: '0.825rem', color: '#6c757d' }}>
                        Reported: {issue.reportedDate}
                      </span>
                    </div>

                    {issue.resolution && (
                      <div style={{ marginTop: '0.75rem', backgroundColor: '#d4edda', color: '#155724', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.85rem' }}>
                        <strong>Resolution:</strong> {issue.resolution} (Resolved on {issue.resolvedDate || 'recent'})
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={issue.status}
                      onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        fontSize: '0.825rem',
                        borderRadius: '6px',
                        border: '1px solid #ced4da',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteIssue(issue.id)}
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
              </div>
            ))
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
              maxWidth: '500px',
              width: '100%',
            }}>
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem', color: '#dc3545' }}>Report Project Issue / Blocker</h2>
              <form onSubmit={handleCreateIssue}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Title *</label>
                  <input
                    type="text"
                    required
                    value={newIssue.title}
                    onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })}
                    placeholder="e.g. Access blocked to university repository"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea
                    rows={3}
                    value={newIssue.description}
                    onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                    placeholder="Provide details about the impediment and impact..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Severity</label>
                    <select
                      value={newIssue.severity}
                      onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Assign To</label>
                    <select
                      value={newIssue.assignedTo}
                      onChange={(e) => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    >
                      {teamMembers.map(m => (
                        <option key={m.username} value={m.name}>{m.name}</option>
                      ))}
                      {teamMembers.length === 0 && <option value="Anurag">Anurag</option>}
                    </select>
                  </div>
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
                    style={{ padding: '0.5rem 1.25rem', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {isSubmitting ? 'Reporting...' : 'Submit Issue'}
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