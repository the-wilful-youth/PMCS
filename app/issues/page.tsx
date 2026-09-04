'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function IssuesPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] =
    useState<'all' | 'open' | 'in-progress' | 'resolved' | 'closed' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Sample issues based on Chronicle_Project_Management_System.xlsx
  const initialIssues = [
    {
      id: 'I-001',
      problem: 'Insufficient storage space for large datasets',
      description: 'The allocated storage space (50GB) is insufficient for the Linux kernel performance traces dataset which requires 15.2GB just for raw data, plus additional space for processing.',
      reportedBy: 'Prajjwal',
      dateReported: '2026-08-15',
      severity: 'High',
      assignedPerson: 'Anurag',
      status: 'In Progress',
      expectedResolution: '2026-08-20',
      resolution: '',
      notes: 'Coordinating with IT to increase storage allocation to 200GB',
      relatedTask: 'T-004' // Dataset acquisition
    },
    {
      id: 'I-002',
      problem: 'Missing dependency for eBPF development tools',
      description: 'Required kernel headers and development packages for eBPF program compilation are not available in the default repositories.',
      reportedBy: 'Tanishk',
      dateReported: '2026-08-12',
      severity: 'Medium',
      assignedPerson: 'Tanishk',
      status: 'Open',
      expectedResolution: '2026-08-18',
      resolution: '',
      notes: 'Need to add custom repositories or compile from source',
      relatedTask: 'T-005' // Preprocessing pipeline
    },
    {
      id: 'I-003',
      problem: 'Network timeout when downloading large datasets',
      description: 'Intermittent network timeouts occurring when attempting to download datasets larger than 5GB from external sources.',
      reportedBy: 'Divyanshi',
      dateReported: '2026-08-10',
      severity: 'Medium',
      assignedPerson: 'Divyanshi',
      status: 'Open',
      expectedResolution: '2026-08-17',
      resolution: '',
      notes: 'Implementing retry logic and download resumption capabilities',
      relatedTask: 'T-002' // Finalize Linux datasets
    },
    {
      id: 'I-004',
      problem: 'Literature review scope too broad',
      description: 'Initial literature review scope includes too many tangential topics, impacting ability to complete within timeline.',
      reportedBy: 'Tanishk',
      dateReported: '2026-08-08',
      severity: 'Low',
      assignedPerson: 'Prajjwal',
      status: 'Resolved',
      expectedResolution: '2026-08-15',
      resolution: 'Narrowed focus to Linux performance analysis and related subsystems only.',
      notes: 'Scope revised and approved by team',
      relatedTask: 'T-003' // Literature review
    },
    {
      id: 'I-005',
      problem: 'Critical: Authentication system vulnerability',
      description: 'Potential security vulnerability identified in the authentication system that could allow unauthorized access.',
      reportedBy: 'Anurag',
      dateReported: '2026-08-01',
      severity: 'Critical',
      assignedPerson: 'Anurag',
      status: 'Resolved',
      expectedResolution: '2026-08-02',
      resolution: 'Implemented additional input validation and rate limiting to mitigate the vulnerability.',
      notes: 'Security patch applied and verified',
      relatedTask: null // System-wide issue
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setIssues(initialIssues);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddIssue = () => {
    router.push('/issues/new');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading issues...</p>
      </div>
    );
  }

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    if (filter === 'open') return issue.status === 'Open';
    if (filter === 'in-progress') return issue.status === 'In Progress';
    if (filter === 'resolved') return issue.status === 'Resolved';
    if (filter === 'closed') return issue.status === 'Closed';
    if (filter === 'critical') return issue.severity === 'Critical';
    if (filter === 'high') return issue.severity === 'High';
    if (filter === 'medium') return issue.severity === 'Medium';
    if (filter === 'low') return issue.severity === 'Low';
    return true;
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Issues</h1>
          <div>
            <button
              onClick={handleAddIssue}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Report Issue
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
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
            All ({issues.length})
          </button>
          <button
            onClick={() => setFilter('open')}
            className={filter === 'open' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'open' ? '#0d6efd' : 'white',
              color: filter === 'open' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Open ({issues.filter(i => i.status === 'Open').length})
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
            In Progress ({issues.filter(i => i.status === 'In Progress').length})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={filter === 'resolved' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'resolved' ? '#0d6efd' : 'white',
              color: filter === 'resolved' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Resolved ({issues.filter(i => i.status === 'Resolved').length})
          </button>
          <button
            onClick={() => setFilter('closed')}
            className={filter === 'closed' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'closed' ? '#0d6efd' : 'white',
              color: filter === 'closed' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Closed ({issues.filter(i => i.status === 'Closed').length})
          </button>
          <div style={{ flex: 1 }}></div> {/* Spacer */}
          <button
            onClick={() => setFilter('critical')}
            className={filter === 'critical' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'critical' ? '#dc3545' : 'white',
              color: filter === 'critical' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Critical ({issues.filter(i => i.severity === 'Critical').length})
          </button>
          <button
            onClick={() => setFilter('high')}
            className={filter === 'high' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'high' ? '#dc3545' : 'white',
              color: filter === 'high' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            High ({issues.filter(i => i.severity === 'High').length})
          </button>
          <button
            onClick={() => setFilter('medium')}
            className={filter === 'medium' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'medium' ? '#ffc107' : 'white',
              color: filter === 'medium' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Medium ({issues.filter(i => i.severity === 'Medium').length})
          </button>
          <button
            onClick={() => setFilter('low')}
            className={filter === 'low' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'low' ? '#28a745' : 'white',
              color: filter === 'low' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Low ({issues.filter(i => i.severity === 'Low').length})
          </button>
        </div>

        {/* Issues List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredIssues.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No issues found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Issues
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredIssues.map((issue) => (
                <div key={issue.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        [{issue.id}] {issue.problem}
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        {issue.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: getSeverityBadgeColor(issue.severity),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {issue.severity}
                        </span>
                        <span
                          style={{
                            backgroundColor: getStatusBadgeColor(issue.status),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {issue.status}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          Reported by: {issue.reportedBy}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          Assigned to: {issue.assignedPerson || 'Unassigned'}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Related Task: {issue.relatedTask || 'None'}
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Dates: Reported {issue.dateReported} • Expected Resolution: {issue.expectedResolution}
                      </div>
                      {issue.resolution && (
                        <div style={{ marginTop: '0.5rem', padding: '1rem', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                          <p style={{ margin: '0', fontSize: '0.85rem', color: '#155724' }}>
                            <strong>Resolution:</strong> {issue.resolution}
                          </p>
                        </div>
                      )}
                      {issue.notes && (
                        <div style={{ marginTop: '0.25rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          <p style={{ margin: '0', fontSize: '0.85rem', color: '#6c757d', fontStyle: 'italic' }}>
                            <strong>Notes:</strong> {issue.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        <strong>Reported:</strong> {issue.dateReported}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        <strong>Expected:</strong> {issue.expectedResolution}
                      </div>
                      <div style={{ marginTop: '0.5rem' }}>
                        {issue.status === 'Open' || issue.status === 'In Progress' ? (
                          <button
                            onClick={() => alert(`Issue ${issue.id} functionality would be implemented here`)}
                            style={{
                              display: 'inline-block',
                              padding: '0.5rem 1rem',
                              backgroundColor: issue.severity === 'Critical' ? '#dc3545' :
                                          issue.severity === 'High' ? '#fd7e14' :
                                          issue.severity === 'Medium' ? '#ffc107' :
                                          '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.875rem'
                            }}
                          >
                            {issue.status === 'Open' ? 'Assign to Me' : 'Update Progress'}
                          </button>
                        ) : (
                          <span style={{
                            fontSize: '0.85rem',
                            color: issue.status === 'Resolved' ? '#28a745' : '#6c757d'
                          }}>
                            {issue.status === 'Resolved' ? 'Resolved' : 'Closed'}
                          </span>
                        )}
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

// Helper functions for badge colors
const getSeverityBadgeColor = (severity: string): string => {
  switch (severity) {
    case 'Critical': return '#dc3545';
    case 'High': return '#fd7e14';
    case 'Medium': return '#ffc107';
    case 'Low': return '#28a745';
    default: return '#6c757d';
  }
};

const getStatusBadgeColor = (status: string): string => {
  switch (status) {
    case 'Open': return '#fd7e14';
    case 'In Progress': return '#ffc107';
    case 'Resolved': return '#28a745';
    case 'Closed': return '#6c757d';
    default: return '#6c757d';
  }
};