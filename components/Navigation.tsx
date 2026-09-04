'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout, getCurrentUser } from '@/lib/auth';

interface NavProject {
  id: string;
  name: string;
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/' },
  { label: 'Projects', path: '/projects' },
  { label: 'My Work', path: '/my-work' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Team', path: '/team' },
  { label: 'Documents', path: '/documents' },
  { label: 'Research', path: '/research' },
  { label: 'Datasets', path: '/datasets' },
  { label: 'Meetings', path: '/meetings' },
  { label: 'Milestones', path: '/milestones' },
  { label: 'Issues', path: '/issues' },
  { label: 'Calendar', path: '/calendar' },
  { label: 'Reports', path: '/reports' },
  { label: 'Activity', path: '/activity' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [projects, setProjects] = useState<NavProject[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('all');
  const [activeProjectName, setActiveProjectName] = useState<string>('All Projects');

  const updateActiveProjectFromStorage = () => {
    if (typeof window !== 'undefined') {
      const storedId = window.localStorage.getItem('pmcs_active_project_id') || 'all';
      const storedName = window.localStorage.getItem('pmcs_active_project_name') || 'All Projects';
      setActiveProjectId(storedId);
      setActiveProjectName(storedName);
    }
  };

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    updateActiveProjectFromStorage();

    // Fetch projects for switcher dropdown
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : { projects: [] }))
      .then((data) => {
        if (data.projects) {
          setProjects(data.projects);
          if (typeof window !== 'undefined') {
            const storedId = window.localStorage.getItem('pmcs_active_project_id');
            if (storedId && storedId !== 'all') {
              const matched = data.projects.find((p: NavProject) => p.id === storedId);
              if (matched) {
                setActiveProjectName(matched.name);
              }
            }
          }
        }
      })
      .catch(() => {});

    const handleProjectChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.projectId) {
        setActiveProjectId(customEvent.detail.projectId);
        setActiveProjectName(customEvent.detail.projectName || 'Active Project');
      } else {
        updateActiveProjectFromStorage();
      }
    };

    window.addEventListener('pmcs-project-changed', handleProjectChanged);
    return () => {
      window.removeEventListener('pmcs-project-changed', handleProjectChanged);
    };
  }, [pathname]);

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    if (selected === '__new__') {
      router.push('/projects/new');
      return;
    }

    if (selected === 'all') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('pmcs_active_project_id');
        window.localStorage.removeItem('pmcs_active_project_name');
        setActiveProjectId('all');
        setActiveProjectName('All Projects');
        window.dispatchEvent(new CustomEvent('pmcs-project-changed', { detail: { projectId: 'all', projectName: 'All Projects' } }));
      }
    } else {
      const proj = projects.find((p) => p.id === selected);
      if (proj && typeof window !== 'undefined') {
        window.localStorage.setItem('pmcs_active_project_id', proj.id);
        window.localStorage.setItem('pmcs_active_project_name', proj.name);
        setActiveProjectId(proj.id);
        setActiveProjectName(proj.name);
        window.dispatchEvent(new CustomEvent('pmcs-project-changed', { detail: { projectId: proj.id, projectName: proj.name } }));
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (pathname === '/login') {
    return null;
  }

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #dee2e6',
        boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '0.85rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        {/* Brand and Project Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            onClick={() => router.push('/')}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#0d6efd',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                letterSpacing: '-0.05em',
              }}
            >
              P
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#212529', letterSpacing: '-0.02em' }}>
                  PMCS
                </span>
                <span style={{ fontSize: '0.75rem', color: '#6c757d', fontWeight: 500 }}>
                  Workspace
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: activeProjectId !== 'all' ? '#0d6efd' : '#6c757d',
                  fontWeight: 600,
                  maxWidth: '220px',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {activeProjectId !== 'all' ? `Project: ${activeProjectName}` : 'All Projects Context'}
              </span>
            </div>
          </div>

          {/* Project Switcher Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#6c757d', fontWeight: 600 }}>Active:</span>
            <select
              value={activeProjectId}
              onChange={handleProjectSelect}
              style={{
                padding: '0.35rem 0.65rem',
                fontSize: '0.825rem',
                fontWeight: 500,
                color: '#212529',
                backgroundColor: '#f8f9fa',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '210px',
              }}
            >
              <option value="all">Global (All Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value="__new__">+ New Project...</option>
            </select>
          </div>
        </div>

        {/* User Info & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#212529' }}>
              {currentUser?.name || currentUser?.username || 'Authorized Member'}
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '0.1rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: currentUser?.role === 'admin' ? '#cff4fc' : '#e2e3e5',
                color: currentUser?.role === 'admin' ? '#055160' : '#383d41',
              }}
            >
              {currentUser?.role === 'admin' ? 'Project Admin' : 'Team Member'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.45rem 0.9rem',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#dc3545',
              backgroundColor: '#fff',
              border: '1px solid #dc3545',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
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
      </div>

      {/* Navigation Links Bar */}
      <nav
        style={{
          maxWidth: '1300px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          gap: '0.25rem',
          overflowX: 'auto',
          borderTop: '1px solid #f1f3f5',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              style={{
                padding: '0.65rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#0d6efd' : '#495057',
                border: 'none',
                borderBottom: isActive ? '2px solid #0d6efd' : '2px solid transparent',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'color 0.15s ease',
              }}
              onMouseOver={(e) => {
                if (!isActive) e.currentTarget.style.color = '#0d6efd';
              }}
              onMouseOut={(e) => {
                if (!isActive) e.currentTarget.style.color = '#495057';
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
