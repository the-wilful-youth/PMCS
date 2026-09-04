'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function ResearchPage() {
  const router = useRouter();
  const [research, setResearch] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Add Paper Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPaper, setNewPaper] = useState({
    title: '',
    authors: '',
    year: new Date().getFullYear(),
    publicationVenue: '',
    relevance: 'High',
    status: 'Identified',
    fileOrLink: '',
    keyFindings: '',
    notes: '',
  });

  const loadResearch = async () => {
    try {
      const res = await fetch('/api/research');
      if (res.ok) {
        const data = await res.json();
        setResearch(data.research);
      }
    } catch (err) {
      console.error('Failed to load research papers:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      loadResearch().finally(() => setIsLoading(false));
    }
  }, []);

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaper.title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPaper),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewPaper({
          title: '',
          authors: '',
          year: new Date().getFullYear(),
          publicationVenue: '',
          relevance: 'High',
          status: 'Identified',
          fileOrLink: '',
          keyFindings: '',
          notes: '',
        });
        await loadResearch();
      }
    } catch (err) {
      console.error('Failed to add research paper:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/research/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setResearch(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error('Failed to update research status:', err);
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm(`Are you sure you want to delete paper ${id}?`)) return;
    try {
      const res = await fetch(`/api/research/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setResearch(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete research paper:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading research library...</p>
      </div>
    );
  }

  const filteredResearch = research.filter(p => {
    if (filter === 'all') return true;
    return p.status.toLowerCase() === filter.toLowerCase() || p.relevance.toLowerCase() === filter.toLowerCase();
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Research Papers</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Academic literature, methodologies, citations, and key findings
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
            + Add Paper
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
            All ({research.length})
          </button>
          <button
            onClick={() => setFilter('identified')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'identified' ? '#0d6efd' : 'white',
              color: filter === 'identified' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Identified
          </button>
          <button
            onClick={() => setFilter('reading')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'reading' ? '#0d6efd' : 'white',
              color: filter === 'reading' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Reading
          </button>
          <button
            onClick={() => setFilter('summarized')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'summarized' ? '#0d6efd' : 'white',
              color: filter === 'summarized' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Summarized
          </button>
        </div>

        {/* Papers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredResearch.map(paper => (
            <div key={paper.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d6efd', backgroundColor: '#e7f1ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {paper.id} • {paper.year}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#212529' }}>{paper.title}</h3>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.5rem' }}>
                    Authors: <strong>{paper.authors}</strong> • Venue: {paper.publicationVenue || 'Conference/Journal'}
                  </div>

                  {paper.keyFindings && (
                    <div style={{ backgroundColor: '#f8f9fa', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', color: '#333', marginBottom: '0.5rem' }}>
                      <strong>Key Findings:</strong> {paper.keyFindings}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ backgroundColor: '#e2e3e5', color: '#383d41', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {paper.relevance} Relevance
                    </span>
                    {paper.fileOrLink && (
                      <a href={paper.fileOrLink} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: '#0d6efd', textDecoration: 'none', fontWeight: 600 }}>
                        🔗 View Paper Link ↗
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <select
                    value={paper.status}
                    onChange={(e) => handleStatusChange(paper.id, e.target.value)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.825rem',
                      borderRadius: '6px',
                      border: '1px solid #ced4da',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="Identified">Identified</option>
                    <option value="Reading">Reading</option>
                    <option value="Summarized">Summarized</option>
                    <option value="Applied">Applied</option>
                  </select>

                  {currentUser?.role === 'admin' && (
                    <button
                      onClick={() => handleDeletePaper(paper.id)}
                      style={{ backgroundColor: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
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
              maxWidth: '550px',
              width: '100%',
            }}>
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem' }}>Add Research Paper</h2>
              <form onSubmit={handleCreatePaper}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Title *</label>
                  <input
                    type="text"
                    required
                    value={newPaper.title}
                    onChange={(e) => setNewPaper({ ...newPaper, title: e.target.value })}
                    placeholder="e.g. Memory profiling in Linux containers"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Authors</label>
                    <input
                      type="text"
                      value={newPaper.authors}
                      onChange={(e) => setNewPaper({ ...newPaper, authors: e.target.value })}
                      placeholder="e.g. Smith et al."
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Year</label>
                    <input
                      type="number"
                      value={newPaper.year}
                      onChange={(e) => setNewPaper({ ...newPaper, year: Number(e.target.value) })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Publication Venue</label>
                  <input
                    type="text"
                    value={newPaper.publicationVenue}
                    onChange={(e) => setNewPaper({ ...newPaper, publicationVenue: e.target.value })}
                    placeholder="e.g. USENIX ATC, ACM SIGMETRICS"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Paper Link / DOI</label>
                  <input
                    type="url"
                    value={newPaper.fileOrLink}
                    onChange={(e) => setNewPaper({ ...newPaper, fileOrLink: e.target.value })}
                    placeholder="https://arxiv.org/..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Key Findings</label>
                  <textarea
                    rows={2}
                    value={newPaper.keyFindings}
                    onChange={(e) => setNewPaper({ ...newPaper, keyFindings: e.target.value })}
                    placeholder="Main methodologies, benchmarks or conclusions..."
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
                    {isSubmitting ? 'Adding...' : 'Add Paper'}
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