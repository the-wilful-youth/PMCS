'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'identified' | 'access-requested' | 'access-granted' | 'downloaded' | 'validated' | 'analyzed' | 'ready-for-use'>('all');

  // Sample datasets based on Chronicle_Project_Management_System.xlsx
  const initialDatasets = [
    {
      id: 'DS-001',
      name: 'Linux Kernel Performance Traces',
      description: 'Performance trace data from various Linux kernel versions',
      source: 'Linux Kernel Tracepoint Repository',
      accessURL: 'https://traces.example.com/linux-perf-traces',
      accessStatus: 'Access Granted',
      downloadStatus: 'Downloaded',
      license: 'GPL-2.0',
      operatingSystem: 'Linux',
      datasetType: 'Performance Traces',
      size: '15.2 GB',
      numberOfSamples: '450,000+',
      labelsCategories: ['cpu-usage', 'memory-usage', 'io-operations', 'network-traffic'],
      features: ['timestamp', 'process-id', 'syscall-type', 'duration', 'resources-used'],
      preprocessingRequirements: 'Basic cleaning, normalization, outlier removal',
      owner: 'Divyanshi',
      analysisStatus: 'Analyzed',
      notes: 'Collected from kernel versions 5.4 through 6.2'
    },
    {
      id: 'DS-002',
      name: 'Network Traffic Classification Dataset',
      description: 'Labeled network traffic samples for classification tasks',
      source: 'ISCX VPN-Tor Dataset Repository',
      accessURL: 'https://www.unb.ca/cic/datasets/vpn.html',
      accessStatus: 'Access Granted',
      downloadStatus: 'Downloaded',
      license: 'CC-BY-NC-4.0',
      operatingSystem: 'Platform Independent',
      datasetType: 'Network Traffic',
      size: '8.7 GB',
      numberOfSamples: '2,300,000+',
      labelsCategories: ['vpn', 'non-vpn', 'tor', 'browsing', 'chat', 'streaming', 'email', 'p2p'],
      features: ['source-ip', 'dest-ip', 'source-port', 'dest-port', 'protocol', 'timestamp', 'packet-size', 'inter-arrival-time'],
      preprocessingRequirements: 'IP anonymization, feature scaling, label encoding',
      owner: 'Tanishk',
      analysisStatus: 'Ready for Use',
      notes: 'Excellent for testing ML-based classification approaches'
    },
    {
      id: 'DS-003',
      name: 'System Call Benchmark Suite',
      description: 'Benchmark suite for measuring system call performance',
      source: 'GitHub - syscall-benchmark-suite',
      accessURL: 'https://github.com/example/syscall-benchmark-suite',
      accessStatus: 'Access Requested',
      downloadStatus: 'Not Downloaded',
      license: 'MIT',
      operatingSystem: 'Linux',
      datasetType: 'Performance Benchmarks',
      size: '2.1 GB',
      numberOfSamples: '1,200,000+',
      labelsCategories: ['read', 'write', 'open', 'close', 'fork', 'exec', 'wait'],
      features: ['syscall-name', 'arguments', 'return-value', 'execution-time-ns', 'cpu-cycles'],
      preprocessingRequirements: 'None required - ready to use format',
      owner: 'Prajjwal',
      analysisStatus: 'Identified',
      notes: 'Need to request access from maintainers'
    },
    {
      id: 'DS-004',
      name: 'Apache Spark Performance Logs',
      description: 'Performance logs from Apache Spark preprocessing workloads',
      source: 'Internal Project Logs',
      accessURL: 'internal://spark-perf-logs',
      accessStatus: 'Access Granted',
      downloadStatus: 'Downloaded',
      license: 'Internal Use Only',
      operatingSystem: 'Platform Independent',
      datasetType: 'Performance Logs',
      size: '3.4 GB',
      numberOfSamples: '850,000+',
      labelsCategories: ['job-start', 'job-end', 'stage-complete', 'task-failed'],
      features: ['timestamp', 'job-id', 'stage-id', 'task-id', 'duration-ms', 'memory-used-mb', 'disk-used-mb'],
      preprocessingRequirements: 'Log parsing, timestamp normalization, anomaly detection',
      owner: 'Anurag',
      analysisStatus: 'Validated',
      notes: 'From our internal preprocessing pipeline testing'
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setDatasets(initialDatasets);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddDataset = () => {
    router.push('/datasets/new');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading datasets...</p>
      </div>
    );
  }

  const filteredDatasets = datasets.filter(dataset => {
    if (filter === 'all') return true;
    const accessStatusMatch = dataset.accessStatus.toLowerCase().replace(/\s/g, '-') === filter;
    const downloadStatusMatch = dataset.downloadStatus.toLowerCase().replace(/\s/g, '-') === filter;
    const analysisStatusMatch = dataset.analysisStatus.toLowerCase().replace(/\s/g, '-') === filter;
    return accessStatusMatch || downloadStatusMatch || analysisStatusMatch;
  });

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Datasets</h1>
          <div>
            <button
              onClick={handleAddDataset}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Dataset
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
            All ({datasets.length})
          </button>
          <button
            onClick={() => setFilter('identified')}
            className={filter === 'identified' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'identified' ? '#0d6efd' : 'white',
              color: filter === 'identified' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Identified ({datasets.filter(d => d.analysisStatus === 'Identified').length})
          </button>
          <button
            onClick={() => setFilter('access-requested')}
            className={filter === 'access-requested' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'access-requested' ? '#0d6efd' : 'white',
              color: filter === 'access-requested' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Access Requested ({datasets.filter(d => d.accessStatus === 'Access Requested').length})
          </button>
          <button
            onClick={() => setFilter('access-granted')}
            className={filter === 'access-granted' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'access-granted' ? '#0d6efd' : 'white',
              color: filter === 'access-granted' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Access Granted ({datasets.filter(d => d.accessStatus === 'Access Granted').length})
          </button>
          <button
            onClick={() => setFilter('downloaded')}
            className={filter === 'downloaded' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'downloaded' ? '#0d6efd' : 'white',
              color: filter === 'downloaded' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Downloaded ({datasets.filter(d => d.downloadStatus === 'Downloaded').length})
          </button>
          <button
            onClick={() => setFilter('validated')}
            className={filter === 'validated' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'validated' ? '#0d6efd' : 'white',
              color: filter === 'validated' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Validated ({datasets.filter(d => d.analysisStatus === 'Validated').length})
          </button>
          <button
            onClick={() => setFilter('analyzed')}
            className={filter === 'analyzed' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'analyzed' ? '#0d6efd' : 'white',
              color: filter === 'analyzed' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Analyzed ({datasets.filter(d => d.analysisStatus === 'Analyzed').length})
          </button>
          <button
            onClick={() => setFilter('ready-for-use')}
            className={filter === 'ready-for-use' ? 'active-filter' : ''}
            style={{
              padding: '0.5rem 1rem',
              border: '1px solid #dee2e6',
              backgroundColor: filter === 'ready-for-use' ? '#0d6efd' : 'white',
              color: filter === 'ready-for-use' ? 'white' : '#212529',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Ready for Use ({datasets.filter(d => d.analysisStatus === 'Ready for Use').length})
          </button>
        </div>

        {/* Datasets List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredDatasets.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No datasets found</p>
              {filter !== 'all' && (
                <button
                  onClick={() => setFilter('all')}
                  style={{ marginTop: '1rem', backgroundColor: '#0d6efd', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Show All Datasets
                </button>
              )}
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {filteredDatasets.map((dataset) => (
                <div key={dataset.id} style={{ borderBottom: '1px solid #eee', padding: '1.5rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        {dataset.name}
                      </h4>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        {dataset.description}
                      </p>
                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            backgroundColor: getStatusBadgeColor(dataset.accessStatus),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          Access: {dataset.accessStatus}
                        </span>
                        <span
                          style={{
                            backgroundColor: getStatusBadgeColor(dataset.downloadStatus),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          Download: {dataset.downloadStatus}
                        </span>
                        <span
                          style={{
                            backgroundColor: getStatusBadgeColor(dataset.analysisStatus),
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '3px',
                            fontSize: '0.75rem',
                            fontWeight: 600
                          }}
                        >
                          Analysis: {dataset.analysisStatus}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          Size: {dataset.size}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                          By: {dataset.owner}
                        </span>
                      </div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Related Task: {getRelatedTask(dataset.name)} || 'None'
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        Type: {dataset.datasetType} • OS: {dataset.operatingSystem}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '140px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        Samples: {dataset.numberOfSamples}
                      </div>
                      <div style={{ marginTop: '0.25rem' }}>
                        <a
                          href={dataset.accessURL}
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
                          Access URL
                        </a>
                        {dataset.downloadStatus === 'Downloaded' && (
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              alert('Download functionality would be implemented here');
                            }}
                            style={{
                              display: 'inline-block',
                              marginTop: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: '#28a745',
                              color: 'white',
                              textDecoration: 'none',
                              borderRadius: '3px',
                              fontSize: '0.75rem'
                            }}
                          >
                            Download
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

// Helper function to get related task for a dataset
const getRelatedTask = (datasetName: string): string | null => {
  const taskMap: Record<string, string> = {
    'Linux Kernel Performance Traces': 'T-002',
    'Network Traffic Classification Dataset': 'T-002',
    'System Call Benchmark Suite': 'T-001',
    'Apache Spark Performance Logs': 'T-005'
  };
  return taskMap[datasetName] || null;
}

// Helper functions for status badge colors
const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'access granted':
    case 'download completed':
    case 'validated':
    case 'analyzed':
    case 'ready for use':
      return '#28a745';
    case 'access requested':
    case 'identified':
      return '#ffc107';
    case 'not downloaded':
    case 'not validated':
      return '#6c757d';
    default:
      return '#6c757d';
  }
};