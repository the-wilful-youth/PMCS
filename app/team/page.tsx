'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  username: string;
  email: string;
  joinedDate: string;
  status: string;
  avatar: string;
}

export default function TeamPage() {
  const router = useRouter();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Team members based on Chronicle_Project_Management_System.xlsx and project.md
  const initialTeam = [
    {
      id: 'u-1',
      name: 'Anurag',
      role: 'Project Admin',
      username: 'anurag',
      email: 'anurag@pmcs.local',
      joinedDate: '2026-08-01',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40/0d6efd/ffffff?text=A'
    },
    {
      id: 'u-2',
      name: 'Divyanshi',
      role: 'Team Member',
      username: 'divyanshi',
      email: 'divyanshi@pmcs.local',
      joinedDate: '2026-08-01',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40/28a745/ffffff?text=D'
    },
    {
      id: 'u-3',
      name: 'Tanishk',
      role: 'Team Member',
      username: 'tanishk',
      email: 'tanishk@pmcs.local',
      joinedDate: '2026-08-01',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40/ffc107/212529?text=T'
    },
    {
      id: 'u-4',
      name: 'Prajjwal',
      role: 'Team Member',
      username: 'prajjwal',
      email: 'prajjwal@pmcs.local',
      joinedDate: '2026-08-01',
      status: 'Active',
      avatar: 'https://via.placeholder.com/40x40/17a2b8/ffffff?text=P'
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setTeamMembers(initialTeam);
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
        <p>Loading team members...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0}}>Team Management</h1>
          <div>
            <button
              onClick={() => router.push('/team/new')}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Member
            </button>
          </div>
        </div>

        {/* Team Stats */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529' }}>Total Members</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#0d6efd' }}>
                {teamMembers.length}
              </p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529' }}>Admins</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#0d6efd' }}>
                {teamMembers.filter(m => m.role.includes('Admin')).length}
              </p>
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529' }}>Members</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0, color: '#28a745' }}>
                {teamMembers.filter(m => m.role === 'Team Member').length}
              </p>
            </div>
          </div>
        </div>

        {/* Team Members List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '1.5rem' }}>
            {teamMembers.map((member) => (
              <div key={member.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem 0', display: 'flex', alignItems: 'center' }}>
                <div style={{ flex: 0, marginRight: '1.5rem' }}>
                  <img
                    src={member.avatar}
                    alt={`${member.name}'s avatar`}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: '#212529', fontSize: '1.1rem' }}>
                    {member.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: member.role.includes('Admin') ? '#cff4fc' : '#e2e3e5',
                        color: member.role.includes('Admin') ? '#055160' : '#383d41',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {member.role}
                    </span>
                    <span
                      style={{
                        backgroundColor: member.status === 'Active' ? '#d4edda' : '#f8d7da',
                        color: member.status === 'Active' ? '#155724' : '#721c24',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '3px',
                        fontSize: '0.75rem'
                      }}
                    >
                      {member.status}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.25rem 0', color: '#6c757d', fontSize: '0.875rem' }}>
                    {member.email}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6c757d' }}>
                    Joined: {member.joinedDate}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}