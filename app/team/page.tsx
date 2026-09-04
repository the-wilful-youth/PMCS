'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function TeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTeam = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data.team);
      }
    } catch (err) {
      console.error('Failed to load team:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      loadTeam().finally(() => setIsLoading(false));
    }
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/team/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setTeam(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
      }
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the project team?`)) return;
    try {
      const res = await fetch(`/api/team/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        setTeam(prev => prev.filter(m => m.id !== userId));
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading project team...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Project Team</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Members, role assignments, and workload distribution
            </p>
          </div>
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => router.push('/team/new')}
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
              + Add Member
            </button>
          )}
        </div>

        {/* Team Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {team.map(member => (
            <div key={member.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: member.role === 'admin' ? '#cff4fc' : '#e2e3e5',
                  color: member.role === 'admin' ? '#055160' : '#383d41',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                }}>
                  {member.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#212529' }}>{member.name}</h3>
                  <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6c757d' }}>@{member.username}</p>
                </div>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#495057', marginBottom: '0.5rem' }}>
                📧 {member.email}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: member.role === 'admin' ? '#cff4fc' : '#e2e3e5',
                  color: member.role === 'admin' ? '#055160' : '#383d41',
                }}>
                  {member.role === 'admin' ? 'Project Admin' : member.role === 'reviewer' ? 'Reviewer' : 'Team Member'}
                </span>

                {currentUser?.role === 'admin' && member.username !== currentUser.username && (
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.id, e.target.value)}
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="reviewer">Reviewer</option>
                  </select>
                )}
              </div>

              {/* Workload Stats */}
              <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', border: '1px solid #f1f3f5' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6c757d', marginBottom: '0.35rem' }}>CURRENT WORKLOAD</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0d6efd' }}>{member.totalTasks || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Assigned</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffc107' }}>{member.inProgressTasks || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Active</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#28a745' }}>{member.completedTasks || 0}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6c757d' }}>Done</div>
                  </div>
                </div>
              </div>

              {currentUser?.role === 'admin' && member.username !== currentUser.username && (
                <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleRemoveMember(member.id, member.name)}
                    style={{ backgroundColor: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Remove Member
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}