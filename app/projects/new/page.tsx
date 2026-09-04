'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

interface TeamMember {
  id: string;
  name: string;
  username: string;
  role: string;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string; role: string } | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Planning' as 'Planning' | 'Active' | 'On Hold' | 'Completed',
    members: [] as string[],
  });

  const [customMemberInput, setCustomMemberInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      setFormData((prev) => ({
        ...prev,
        members: [user.name || user.username],
      }));
    }

    // Fetch team members
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => {
        if (data.team) {
          setTeamMembers(data.team);
        }
      })
      .catch((err) => console.error('Failed to load team members', err))
      .finally(() => setLoadingMembers(false));
  }, []);

  const handleToggleMember = (name: string) => {
    setFormData((prev) => {
      const exists = prev.members.includes(name);
      return {
        ...prev,
        members: exists ? prev.members.filter((m) => m !== name) : [...prev.members, name],
      };
    });
  };

  const handleAddCustomMember = () => {
    const trimmed = customMemberInput.trim();
    if (trimmed && !formData.members.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        members: [...prev.members, trimmed],
      }));
      setCustomMemberInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Project name is required.');
      return;
    }
    if (!formData.description.trim()) {
      setError('Project description is required.');
      return;
    }
    if (!formData.startDate || !formData.targetEndDate) {
      setError('Start date and target end date are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project.');
      }

      // Automatically set newly created project as active project
      if (typeof window !== 'undefined' && data.project) {
        window.localStorage.setItem('pmcs_active_project_id', data.project.id);
        window.localStorage.setItem('pmcs_active_project_name', data.project.name);
        window.dispatchEvent(
          new CustomEvent('pmcs-project-changed', {
            detail: { projectId: data.project.id, projectName: data.project.name },
          })
        );
      }

      router.push('/projects');
    } catch (err: any) {
      setError(err.message || 'Error creating project.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/projects"
          style={{ fontSize: '0.875rem', color: '#0d6efd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
        >
          ← Back to Projects
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: '0.5rem 0 0.25rem 0', color: '#212529' }}>
          Create New Project
        </h1>
        <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
          Configure a generalized project workspace for your team or organization.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '0.85rem 1rem',
          backgroundColor: '#f8d7da',
          color: '#842029',
          border: '1px solid #f5c2c7',
          borderRadius: '6px',
          fontSize: '0.875rem',
          marginBottom: '1.5rem'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{
        backgroundColor: '#ffffff',
        border: '1px solid #dee2e6',
        borderRadius: '10px',
        padding: '1.75rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        {/* Project Name */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#212529', marginBottom: '0.4rem' }}>
            Project Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Phoenix Cloud Migration, Data Platform v2, or Marketing Automation"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem',
              fontSize: '0.95rem',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#212529', marginBottom: '0.4rem' }}>
            Description & Scope *
          </label>
          <textarea
            required
            rows={3}
            placeholder="Describe the objectives, deliverables, target outcomes, and overall purpose of this project..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            style={{
              width: '100%',
              padding: '0.6rem 0.85rem',
              fontSize: '0.9rem',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              outline: 'none',
              boxSizing: 'border-box',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Status, Start Date, Target End Date */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#212529', marginBottom: '0.4rem' }}>
              Initial Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              style={{
                width: '100%',
                padding: '0.6rem 0.85rem',
                fontSize: '0.9rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                backgroundColor: '#fff',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="Planning">Planning</option>
              <option value="Active">Active</option>
              <option value="On Hold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#212529', marginBottom: '0.4rem' }}>
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                fontSize: '0.9rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#212529', marginBottom: '0.4rem' }}>
              Target End Date
            </label>
            <input
              type="date"
              value={formData.targetEndDate}
              onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
              style={{
                width: '100%',
                padding: '0.55rem 0.85rem',
                fontSize: '0.9rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* Member Assignment */}
        <div style={{ marginBottom: '1.75rem', borderTop: '1px solid #dee2e6', paddingTop: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#212529', marginBottom: '0.5rem' }}>
            Assign Team Members
          </label>
          <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#6c757d' }}>
            Select registered users to collaborate on this project workspace:
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
            {loadingMembers ? (
              <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>Loading members...</span>
            ) : (
              teamMembers.map((member) => {
                const isSelected = formData.members.includes(member.name);
                return (
                  <button
                    key={member.id || member.username}
                    type="button"
                    onClick={() => handleToggleMember(member.name)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.825rem',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: isSelected ? '#0d6efd' : '#ced4da',
                      backgroundColor: isSelected ? '#e7f1ff' : '#ffffff',
                      color: isSelected ? '#0d6efd' : '#495057',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    {member.name} ({member.role})
                  </button>
                );
              })
            )}
          </div>

          {/* Quick Add Custom Member Name */}
          <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Or add another collaborator..."
              value={customMemberInput}
              onChange={(e) => setCustomMemberInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomMember();
                }
              }}
              style={{
                flex: 1,
                padding: '0.45rem 0.75rem',
                fontSize: '0.85rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                outline: 'none'
              }}
            />
            <button
              type="button"
              onClick={handleAddCustomMember}
              style={{
                padding: '0.45rem 0.85rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: '#6c757d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #dee2e6', paddingTop: '1.25rem' }}>
          <button
            type="button"
            onClick={() => router.push('/projects')}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              backgroundColor: '#f8f9fa',
              color: '#495057',
              border: '1px solid #ced4da',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.6rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              backgroundColor: submitting ? '#6c757d' : '#0d6efd',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: submitting ? 'not-allowed' : 'pointer'
            }}
          >
            {submitting ? 'Creating Project...' : 'Create & Open Project'}
          </button>
        </div>
      </form>
    </div>
  );
}