'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  targetEndDate: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed' | 'Archived';
  admin: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeProjectId, setActiveProjectId] = useState<string>('all');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    if (typeof window !== 'undefined') {
      const storedActive = window.localStorage.getItem('pmcs_active_project_id');
      if (storedActive) {
        setActiveProjectId(storedActive);
      }
    }

    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error(`Failed to load projects (${res.status})`);
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching projects');
    } finally {
      setLoading(false);
    }
  };

  const handleSetActiveProject = (project: Project) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('pmcs_active_project_id', project.id);
      window.localStorage.setItem('pmcs_active_project_name', project.name);
      setActiveProjectId(project.id);
      window.dispatchEvent(new CustomEvent('pmcs-project-changed', { detail: { projectId: project.id, projectName: project.name } }));
    }
  };

  const handleClearActiveProject = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('pmcs_active_project_id');
      window.localStorage.removeItem('pmcs_active_project_name');
      setActiveProjectId('all');
      window.dispatchEvent(new CustomEvent('pmcs-project-changed', { detail: { projectId: 'all', projectName: 'All Projects' } }));
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.admin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' };
      case 'Planning':
        return { bg: '#e3f2fd', text: '#1565c0', border: '#90caf9' };
      case 'On Hold':
        return { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' };
      case 'Completed':
        return { bg: '#f3e5f5', text: '#7b1fa2', border: '#ce93d8' };
      default:
        return { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' };
    }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0 0 0.4rem 0', color: '#212529' }}>
            Projects Directory
          </h1>
          <p style={{ margin: 0, color: '#6c757d', fontSize: '0.95rem' }}>
            Manage and navigate work across multiple team projects, initiatives, and deliverables.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {activeProjectId !== 'all' && (
            <button
              onClick={handleClearActiveProject}
              style={{
                padding: '0.55rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#495057',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Clear Active Filter (View All)
            </button>
          )}

          <Link
            href="/projects/new"
            style={{
              padding: '0.55rem 1.15rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: '#0d6efd',
              border: 'none',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 4px rgba(13,110,253,0.2)',
            }}
          >
            <span>+</span> New Project
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', flex: '1 1 300px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Search projects by name, description, or lead..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.85rem',
              fontSize: '0.9rem',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['all', 'Active', 'Planning', 'On Hold', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: '20px',
                border: '1px solid',
                borderColor: statusFilter === st ? '#0d6efd' : '#ced4da',
                backgroundColor: statusFilter === st ? '#0d6efd' : '#ffffff',
                color: statusFilter === st ? '#ffffff' : '#495057',
                cursor: 'pointer',
              }}
            >
              {st === 'all' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6c757d' }}>
          Loading workspace projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 1.5rem',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          border: '1px dashed #ced4da'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#212529', fontWeight: 600 }}>No projects found</h3>
          <p style={{ margin: '0 0 1.25rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
            {searchQuery ? 'Try adjusting your search criteria or filter.' : 'Get started by creating your first team project.'}
          </p>
          <Link
            href="/projects/new"
            style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              backgroundColor: '#0d6efd',
              color: '#ffffff',
              borderRadius: '6px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            + Create First Project
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredProjects.map((project) => {
            const isActive = activeProjectId === project.id;
            const colors = getStatusColor(project.status);

            return (
              <div
                key={project.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: isActive ? '2px solid #0d6efd' : '1px solid #dee2e6',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isActive ? '0 4px 12px rgba(13,110,253,0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  position: 'relative'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '16px',
                    backgroundColor: '#0d6efd',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.15rem 0.6rem',
                    borderRadius: '12px'
                  }}>
                    Active Workspace
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#212529', lineHeight: 1.3 }}>
                      {project.name}
                    </h2>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      backgroundColor: colors.bg,
                      color: colors.text,
                      border: `1px solid ${colors.border}`,
                      whiteSpace: 'nowrap'
                    }}>
                      {project.status}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '0.875rem',
                    color: '#495057',
                    lineHeight: 1.5,
                    marginBottom: '1rem',
                    minHeight: '42px',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {project.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      color: '#495057'
                    }}>
                      Lead: <strong>{project.admin}</strong>
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #e9ecef',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      color: '#495057'
                    }}>
                      Members: <strong>{project.members.length}</strong>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '1.25rem', borderTop: '1px solid #f1f3f5', paddingTop: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>Timeline:</span>
                      <span style={{ fontWeight: 600, color: '#212529' }}>
                        {project.startDate} → {project.targetEndDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid #f1f3f5', paddingTop: '1rem' }}>
                  {isActive ? (
                    <button
                      onClick={handleClearActiveProject}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        backgroundColor: '#e7f1ff',
                        color: '#0d6efd',
                        border: '1px solid #b6d4fe',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Active (Click to Reset)
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSetActiveProject(project)}
                      style={{
                        flex: 1,
                        padding: '0.45rem',
                        fontSize: '0.825rem',
                        fontWeight: 600,
                        backgroundColor: '#ffffff',
                        color: '#0d6efd',
                        border: '1px solid #0d6efd',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Set Active
                    </button>
                  )}

                  <button
                    onClick={() => {
                      handleSetActiveProject(project);
                      router.push(`/tasks?projectId=${project.id}`);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.45rem',
                      fontSize: '0.825rem',
                      fontWeight: 600,
                      backgroundColor: '#f8f9fa',
                      color: '#212529',
                      border: '1px solid #ced4da',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    View Tasks →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}