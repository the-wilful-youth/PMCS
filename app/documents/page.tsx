'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planning' | 'research' | 'datasets' | 'code' | 'reports' | 'meeting' | 'presentations' | 'diagrams' | 'results' | 'final' | 'other'>('all');

  // Sample documents based on Chronicle_Project_Management_System.xlsx
  const initialDocuments = [
    {
      id: 'D-001',
      name: 'Project Charter',
      description: 'Initial project charter outlining objectives and scope',
      category: 'Project Planning',
      owner: 'Anurag',
      version: '1.0',
      status: 'Approved',
      fileOrLink: 'https://drive.google.com/file/d/example1/view',
      relatedTask: 'T-001',
      uploadedDate: '2026-08-01',
      lastUpdatedDate: '2026-08-15',
      tags: ['charter', 'planning', 'approval']
    },
    {
      id: 'D-002',
      name: 'Linux Dataset Requirements',
      description: 'Requirements document for Linux dataset selection',
      category: 'Research Papers',
      owner: 'Divyanshi',
      version: '0.8',
      status: 'In Review',
      fileOrLink: 'https://drive.google.com/file/d/example2/view',
      relatedTask: 'T-002',
      uploadedDate: '2026-08-05',
      lastUpdatedDate: '2026-08-20',
      tags: ['requirements', 'linux', 'datasets']
    },
    {
      id: 'D-003',
      name: 'Literature Review Template',
      description: 'Standard template for literature reviews',
      category: 'Research Papers',
      owner: 'Tanishk',
      version: '1.2',
      status: 'Approved',
      fileOrLink: 'https://drive.google.com/file/d/example3/view',
      relatedTask: 'T-003',
      uploadedDate: '2026-08-10',
      lastUpdatedDate: '2026-08-25',
      tags: ['template', 'literature', 'review']
    },
    {
      id: 'D-004',
      name: 'Data Acquisition Plan',
      description: 'Plan for acquiring and accessing datasets',
      category: 'Datasets',
      owner: 'Prajjwal',
      version: '0.9',
      status: 'Draft',
      fileOrLink: 'https://drive.google.com/file/d/example4/view',
      relatedTask: 'T-004',
      uploadedDate: '2026-08-12',
      lastUpdatedDate: '2026-08-22',
      tags: ['acquisition', 'plan', 'datasets']
    },
    {
      id: 'D-005',
      name: 'Preprocessing Scripts',
      description: 'Python scripts for data preprocessing',
      category: 'Code Documentation',
      owner: 'Anurag',
      version: '1.0',
      status: 'Approved',
      fileOrLink: 'https://drive.google.com/file/d/example5/view',
      relatedTask: 'T-005',
      uploadedDate: '2026-08-18',
      lastUpdatedDate: '2026-08-28',
      tags: ['preprocessing', 'scripts', 'python']
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setDocuments(initialDocuments);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddDocument = () => {
    router.push('/documents/new');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading documents...</p>
      </div>
    );
  }

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.category.toLowerCase() === filter;
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Documents</h1>
          <div>
            <button
              onClick={handleAddDocument}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Document
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
            All ({documents.length})
          </button>
          <button
            onClick={() => setFilter('planning')}
            className={filter === 'planning' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'planning' ? '#0d6efd' : 'white',
              color: filter === 'planning' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Planning ({documents.filter(d => d.category === 'Project Planning').length})
          </button>
          <button
            onClick={() => setFilter('research')}
            className={filter === 'research' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'research' ? '#0d6efd' : 'white',
              color: filter === 'research' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Research ({documents.filter(d => d.category === 'Research Papers').length})
          </button>
          <button
            onClick={() => setFilter('datasets')}
            className={filter === 'datasets' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'datasets' ? '#0d6efd' : 'white',
              color: filter === 'datasets' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Datasets ({documents.filter(d => d.category === 'Datasets').length})
          </button>
          <button
            onClick={() => setFilter('code')}
            className={filter === 'code' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'code' ? '#0d6efd' : 'white',
              color: filter === 'code' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Code ({documents.filter(d => d.category === 'Code Documentation').length})
          </button>
          <button
            onClick={() => setFilter('reports')}
            className={filter === 'reports' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'reports' ? '#0d6efd' : 'white',
              color: filter === 'reports' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reports ({documents.filter(d => d.category === 'Reports').length})
          </button>
        </div>

        {/* Documents List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredDocuments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No documents found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Documents
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredDocuments.map((document) => (
                <div key={document.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        {document.name}
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        {document.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: getStatusBadgeColor(document.status),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {document.status}
                        </span>
                        <span
                          style={{
                            backgroundColor: '#e2e3e5',
                            color: '#383d41',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {document.category}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          Version: {document.version}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          By: {document.owner}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Related Task: {document.relatedTask || 'None'}
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Tags: {document.tags?.join(', ') || 'None'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        Uploaded: {document.uploadedDate}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                        Updated: {document.lastUpdatedDate}
                      </div>
                      <a
                        href={document.fileOrLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-block',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#0d6efd',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                      >
                        View Document
                      </a>
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

// Helper functions for status badge colors
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Approved': return '#28a745';
    case 'In Review': return '#ffc107';
    case 'Draft': return '#6c757d';
    case 'Archived': return '#dc3545';
    default: return '#6c757d';
  }
};