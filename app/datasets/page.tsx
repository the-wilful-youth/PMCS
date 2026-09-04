'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // Add Dataset Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDataset, setNewDataset] = useState({
    name: '',
    source: '',
    description: '',
    size: '1.0 GB',
    format: 'CSV / Parquet',
    license: 'MIT / Open',
    locationOrUrl: '',
    accessStatus: 'Identified',
    analysisStatus: 'Not Started',
  });

  const loadDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      loadDatasets().finally(() => setIsLoading(false));
    }
  }, []);

  const handleCreateDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDataset.name.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDataset),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewDataset({
          name: '',
          source: '',
          description: '',
          size: '1.0 GB',
          format: 'CSV / Parquet',
          license: 'MIT / Open',
          locationOrUrl: '',
          accessStatus: 'Identified',
          analysisStatus: 'Not Started',
        });
        await loadDatasets();
      }
    } catch (err) {
      console.error('Failed to add dataset:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, field: 'accessStatus' | 'analysisStatus', value: string) => {
    try {
      const res = await fetch(`/api/datasets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        setDatasets(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
      }
    } catch (err) {
      console.error('Failed to update dataset status:', err);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!confirm(`Are you sure you want to delete dataset ${id}?`)) return;
    try {
      const res = await fetch(`/api/datasets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDatasets(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading project datasets...</p>
      </div>
    );
  }

  const filteredDatasets = datasets.filter(d => {
    if (filter === 'all') return true;
    return d.accessStatus.toLowerCase() === filter.toLowerCase() || d.analysisStatus.toLowerCase() === filter.toLowerCase();
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Datasets Management</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Track raw data acquisition, licensing, format, and processing state
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
            + Add Dataset
          </button>
        </div>

        {/* Filters */}
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
            All ({datasets.length})
          </button>
          <button
            onClick={() => setFilter('downloaded')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'downloaded' ? '#28a745' : 'white',
              color: filter === 'downloaded' ? 'white' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Downloaded ({datasets.filter(d => d.accessStatus === 'Downloaded').length})
          </button>
          <button
            onClick={() => setFilter('requested')}
            style={{
              padding: '0.45rem 0.9rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'requested' ? '#ffc107' : 'white',
              color: filter === 'requested' ? '#212529' : '#212529',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 500,
            }}
          >
            Requested ({datasets.filter(d => d.accessStatus === 'Requested').length})
          </button>
        </div>

        {/* Datasets Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
          {filteredDatasets.map(ds => (
            <div key={ds.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d6efd', backgroundColor: '#e7f1ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                    {ds.id} • {ds.format}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#495057' }}>{ds.size}</span>
                </div>

                <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#212529' }}>{ds.name}</h3>
                <p style={{ margin: '0 0 0.75rem', color: '#6c757d', fontSize: '0.875rem' }}>{ds.description}</p>
                <div style={{ fontSize: '0.8rem', color: '#495057', marginBottom: '0.35rem' }}>
                  🏛 Source: <strong>{ds.source}</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#495057', marginBottom: '0.75rem' }}>
                  ⚖️ License: {ds.license}
                </div>

                {/* Status Dropdowns */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#6c757d', fontWeight: 600, marginBottom: '0.15rem' }}>Access Status</label>
                    <select
                      value={ds.accessStatus}
                      onChange={(e) => handleUpdateStatus(ds.id, 'accessStatus', e.target.value)}
                      style={{ width: '100%', padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                      <option value="Identified">Identified</option>
                      <option value="Requested">Requested</option>
                      <option value="Approved">Approved</option>
                      <option value="Downloaded">Downloaded</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#6c757d', fontWeight: 600, marginBottom: '0.15rem' }}>Analysis Status</label>
                    <select
                      value={ds.analysisStatus}
                      onChange={(e) => handleUpdateStatus(ds.id, 'analysisStatus', e.target.value)}
                      style={{ width: '100%', padding: '0.25rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Cleaned">Cleaned</option>
                      <option value="Explored">Explored</option>
                      <option value="Modeled">Modeled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid #f1f3f5' }}>
                <a
                  href={ds.locationOrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.85rem', color: '#0d6efd', textDecoration: 'none', fontWeight: 600 }}
                >
                  🔗 Access Dataset Link ↗
                </a>
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteDataset(ds.id)}
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
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem' }}>Register New Dataset</h2>
              <form onSubmit={handleCreateDataset}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Dataset Name *</label>
                  <input
                    type="text"
                    required
                    value={newDataset.name}
                    onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                    placeholder="e.g. Linux Kernel Syscall Trace Logs"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Source</label>
                    <input
                      type="text"
                      value={newDataset.source}
                      onChange={(e) => setNewDataset({ ...newDataset, source: e.target.value })}
                      placeholder="e.g. Kaggle / University"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Size</label>
                    <input
                      type="text"
                      value={newDataset.size}
                      onChange={(e) => setNewDataset({ ...newDataset, size: e.target.value })}
                      placeholder="e.g. 5.4 GB"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea
                    rows={2}
                    value={newDataset.description}
                    onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Location / Download URL</label>
                  <input
                    type="url"
                    value={newDataset.locationOrUrl}
                    onChange={(e) => setNewDataset({ ...newDataset, locationOrUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
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
                    {isSubmitting ? 'Registering...' : 'Register Dataset'}
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