'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Add Document Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDoc, setNewDoc] = useState({
    name: '',
    description: '',
    category: 'Project Planning',
    version: '1.0',
    status: 'Draft',
    fileOrLink: '',
    tags: '',
  });

  const loadDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      loadDocuments().finally(() => setIsLoading(false));
    }
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name.trim()) return;

    setIsSubmitting(true);
    try {
      const tagsArray = newDoc.tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDoc,
          tags: tagsArray,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewDoc({
          name: '',
          description: '',
          category: 'Project Planning',
          version: '1.0',
          status: 'Draft',
          fileOrLink: '',
          tags: '',
        });
        await loadDocuments();
      }
    } catch (err) {
      console.error('Failed to add document:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDocuments(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm(`Are you sure you want to delete document ${id}?`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading project documents...</p>
      </div>
    );
  }

  const filteredDocs = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.category.toLowerCase().includes(filter.toLowerCase()) || doc.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#28a745';
      case 'In Review': return '#ffc107';
      case 'Draft': return '#6c757d';
      case 'Archived': return '#343a40';
      default: return '#0d6efd';
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Documents & Deliverables</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Project charters, specifications, templates, and reports
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
            + Add Document
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
            All ({documents.length})
          </button>
          <button
            onClick={() => setFilter('planning')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'planning' ? '#0d6efd' : 'white',
              color: filter === 'planning' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Planning
          </button>
          <button
            onClick={() => setFilter('research')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'research' ? '#0d6efd' : 'white',
              color: filter === 'research' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Research
          </button>
          <button
            onClick={() => setFilter('datasets')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'datasets' ? '#0d6efd' : 'white',
              color: filter === 'datasets' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Datasets
          </button>
          <button
            onClick={() => setFilter('approved')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'approved' ? '#28a745' : 'white',
              color: filter === 'approved' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Approved
          </button>
        </div>

        {/* Document Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredDocs.map(doc => (
            <div key={doc.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d6efd', backgroundColor: '#e7f1ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {doc.id} • v{doc.version}
                  </span>
                  <select
                    value={doc.status}
                    onChange={(e) => handleStatusChange(doc.id, e.target.value)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #ced4da',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Draft">Draft</option>
                    <option value="In Review">In Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#212529' }}>{doc.name}</h3>
                <p style={{ margin: '0 0 0.75rem', color: '#6c757d', fontSize: '0.875rem' }}>{doc.description}</p>
                <div style={{ fontSize: '0.8rem', color: '#495057', marginBottom: '0.5rem' }}>
                  📁 Category: <strong>{doc.category}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#495057', marginBottom: '0.75rem' }}>
                  👤 Owner: <strong>{doc.owner}</strong> • Updated: {doc.lastUpdatedDate}
                </div>
                {doc.tags && doc.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    {doc.tags.map((tag: string, idx: number) => (
                      <span key={idx} style={{ backgroundColor: '#f1f3f5', color: '#495057', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f3f5' }}>
                <a
                  href={doc.fileOrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.85rem', color: '#0d6efd', textDecoration: 'none', fontWeight: 600 }}
                >
                  🔗 Open Document ↗
                </a>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    style={{ backgroundColor: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
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
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem' }}>Add Document / Deliverable</h2>
              <form onSubmit={handleCreateDocument}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Document Name *</label>
                  <input
                    type="text"
                    required
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    placeholder="e.g. Architecture Overview Document"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea
                    rows={2}
                    value={newDoc.description}
                    onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Category</label>
                    <select
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    >
                      <option value="Project Planning">Project Planning</option>
                      <option value="Research Papers">Research Papers</option>
                      <option value="Datasets">Datasets</option>
                      <option value="Code & Architecture">Code & Architecture</option>
                      <option value="Meeting Notes">Meeting Notes</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Version</label>
                    <input
                      type="text"
                      value={newDoc.version}
                      onChange={(e) => setNewDoc({ ...newDoc, version: e.target.value })}
                      placeholder="1.0"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>File URL or Drive Link</label>
                  <input
                    type="url"
                    value={newDoc.fileOrLink}
                    onChange={(e) => setNewDoc({ ...newDoc, fileOrLink: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={newDoc.tags}
                    onChange={(e) => setNewDoc({ ...newDoc, tags: e.target.value })}
                    placeholder="architecture, spec, v1"
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
                    {isSubmitting ? 'Saving...' : 'Add Document'}
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