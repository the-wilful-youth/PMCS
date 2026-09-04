'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function ResearchPage() {
  const router = useRouter();
  const [research, setResearch] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'not-read' | 'reading' | 'reviewed' | 'used'>('all');

  // Sample research papers based on Chronicle_Project_Management_System.xlsx
  const initialResearch = [
    {
      id: 'R-001',
      title: 'A Survey of Linux Kernel Performance Analysis Tools',
      authors: 'Smith, J., Johnson, A., Williams, K.',
      publicationYear: 2023,
      url: 'https://example.com/linux-perf-survey-2023',
      pdfFile: 'https://example.com/papers/linux-perf-survey-2023.pdf',
      topic: 'Performance Analysis',
      relevanceScore: 9,
      keyFindings: 'Comprehensive overview of modern Linux performance analysis tools including perf, eBPF, and tracepoints.',
      datasetUsed: 'Linux Kernel Trace Events',
      methodModel: 'Systematic Literature Review',
      limitations: 'Focuses primarily on server-grade Linux distributions',
      responsibleMember: 'Divyanshi',
      relatedTask: 'T-002',
      status: 'Reviewed',
      notes: 'Highly relevant for dataset selection phase'
    },
    {
      id: 'R-002',
      title: 'Deep Learning Approaches for Network Traffic Classification',
      authors: 'Chen, L., Wang, Y., Zhao, Q.',
      publicationYear: 2024,
      url: 'https://example.com/dl-network-classification-2024',
      pdfFile: 'https://example.com/papers/dl-network-classification-2024.pdf',
      topic: 'Machine Learning',
      relevanceScore: 7,
      keyFindings: 'CNN and RNN models achieve >95% accuracy in classifying network traffic patterns.',
      datasetUsed: 'ISCX VPN-Tor Dataset',
      methodModel: 'Convolutional Neural Networks',
      limitations: 'Requires significant computational resources for training',
      responsibleMember: 'Tanishk',
      relatedTask: 'T-003',
      status: 'Reading',
      notes: 'Consider applying similar techniques to our dataset'
    },
    {
      id: 'R-003',
      title: 'Efficient Data Preprocessing Pipelines for Big Data Analytics',
      authors: 'Garcia, M., Rodriguez, P., Lopez, S.',
      publicationYear: 2023,
      url: 'https://example.com/preprocessing-pipelines-2023',
      pdfFile: 'https://example.com/papers/preprocessing-pipelines-2023.pdf',
      topic: 'Data Engineering',
      relevanceScore: 8,
      keyFindings: 'Apache Spark-based pipelines reduce preprocessing time by 60% compared to traditional approaches.',
      datasetUsed: 'TPC-H Benchmark Dataset',
      methodModel: 'Comparative Performance Analysis',
      limitations: 'Studies focused on batch processing rather than streaming data',
      responsibleMember: 'Anurag',
      relatedTask: 'T-005',
      status: 'Used in Report',
      notes: 'Directly applicable to our preprocessing pipeline task'
    },
    {
      id: 'R-004',
      title: 'Benchmarking Linux Filesystems for Scientific Workloads',
      authors: 'Wilson, T., Davis, R., Clark, M.',
      publicationYear: 2024,
      url: 'https://example.com/linux-filesystems-benchmark-2024',
      pdfFile: 'https://example.com/papers/linux-filesystems-benchmark-2024.pdf',
      topic: 'Filesystems',
      relevanceScore: 6,
      keyFindings: 'EXT4 and XFS show comparable performance for scientific I/O workloads.',
      datasetUsed: 'Scientific Storage Benchmark Suite',
      methodModel: 'Performance Benchmarking',
      limitations: 'Limited to single-node configurations',
      responsibleMember: 'Prajjwal',
      relatedTask: 'T-001',
      status: 'Not Read',
      notes: 'Lower priority but useful for workspace setup decisions'
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setResearch(initialResearch);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddResearch = () => {
    router.push('/research/new');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading research...</p>
      </div>
    );
  }

  const filteredResearch = research.filter(item => {
    if (filter === 'all') return true;
    return item.status.toLowerCase().replace(' ', '-') === filter ||
           (filter === 'used' && item.status === 'Used in Report') ||
           (filter === 'not-read' && item.status === 'Not Read');
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Research</h1>
          <div>
            <button
              onClick={handleAddResearch}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Research Paper
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
            All ({research.length})
          </button>
          <button
            onClick={() => setFilter('not-read')}
            className={filter === 'not-read' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'not-read' ? '#0d6efd' : 'white',
              color: filter === 'not-read' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Not Read ({research.filter(r => r.status === 'Not Read').length})
          </button>
          <button
            onClick={() => setFilter('reading')}
            className={filter === 'reading' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'reading' ? '#0d6efd' : 'white',
              color: filter === 'reading' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reading ({research.filter(r => r.status === 'Reading').length})
          </button>
          <button
            onClick={() => setFilter('reviewed')}
            className={filter === 'reviewed' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'reviewed' ? '#0d6efd' : 'white',
              color: filter === 'reviewed' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reviewed ({research.filter(r => r.status === 'Reviewed').length})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={filter === 'used' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'used' ? '#0d6efd' : 'white',
              color: filter === 'used' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Used in Report ({research.filter(r => r.status === 'Used in Report').length})
          </button>
        </div>

        {/* Research List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredResearch.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No research papers found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Research
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredResearch.map((item) => (
                <div key={item.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        {item.title}
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        {item.keyFindings}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: getStatusBadgeColor(item.status),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          {item.status}
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
                          {item.topic}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          Relevance: {item.relevanceScore}/10
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          By: {item.responsibleMember}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Related Task: {item.relatedTask || 'None'}
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Authors: {item.authors} • Year: {item.publicationYear}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        Published: {item.publicationYear}
                      </div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            marginBottom: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#0d6efd',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '3px',
                            fontSize: '0.75rem'
                          }}
                        >
                          View Paper
                        </a>
                        {item.pdfFile && (
                          <a
                            href={item.pdfFile}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#28a745',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '3px',
                              fontSize: '0.75rem'
                            }}
                          >
                            View PDF
                          </a>
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

// Helper functions for status badge colors
const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Not Read': return '#6c757d';
    case 'Reading': return '#ffc107';
    case 'Reviewed': return '#17a2b8';
    case 'Used in Report': return '#28a745';
    default: return '#6c757d';
  }
};