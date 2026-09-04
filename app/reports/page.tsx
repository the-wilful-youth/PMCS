'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

interface ReportTask {
  id: string;
  title: string;
  status: string;
  assignee: string;
  priority: string;
  effort?: number;
  dueDate?: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Sample data for reports
  const sampleTasks: ReportTask[] = [
    { id: 'T-001', title: 'Set up project workspace', status: 'Completed', assignee: 'Anurag', priority: 'Medium', effort: 3, dueDate: '2026-09-15' },
    { id: 'T-002', title: 'Finalize Linux datasets', status: 'In Progress', assignee: 'Divyanshi', priority: 'High', effort: 5, dueDate: '2026-09-20' },
    { id: 'T-003', title: 'Literature review', status: 'In Progress', assignee: 'Tanishk', priority: 'Medium', effort: 5, dueDate: '2026-09-25' },
    { id: 'T-004', title: 'Dataset acquisition', status: 'Not Started', assignee: 'Prajjwal', priority: 'High', effort: 8, dueDate: '2026-09-30' },
    { id: 'T-005', title: 'Preprocessing pipeline', status: 'Not Started', assignee: 'Anurag', priority: 'Medium', effort: 5, dueDate: '2026-10-05' }
  ];


  const sampleTeam = [
    { id: 'u-1', name: 'Anurag', role: 'Project Admin', completedTasks: 1, effortPoints: 3 },
    { id: 'u-2', name: 'Divyanshi', role: 'Team Member', completedTasks: 0, effortPoints: 0 },
    { id: 'u-3', name: 'Tanishk', role: 'Team Member', completedTasks: 0, effortPoints: 0 },
    { id: 'u-4', name: 'Prajjwal', role: 'Team Member', completedTasks: 0, effortPoints: 0 }
  ];

  const sampleResearch = [
    { id: 'R-001', title: 'Linux Kernel Performance Analysis Tools', status: 'Reviewed' },
    { id: 'R-002', title: 'Deep Learning for Network Traffic Classification', status: 'Reading' },
    { id: 'R-003', title: 'Efficient Data Preprocessing Pipelines', status: 'Used in Report' },
    { id: 'R-004', title: 'Benchmarking Linux Filesystems', status: 'Not Read' }
  ];

  const sampleDatasets = [
    { id: 'DS-001', name: 'Linux Kernel Performance Traces', accessStatus: 'Access Granted', analysisStatus: 'Analyzed', downloadStatus: 'Downloaded' },
    { id: 'DS-002', name: 'Network Traffic Classification Dataset', accessStatus: 'Access Granted', analysisStatus: 'Ready for Use', downloadStatus: 'Downloaded' },
    { id: 'DS-003', name: 'System Call Benchmark Suite', accessStatus: 'Access Requested', analysisStatus: 'Identified', downloadStatus: 'Downloaded' },
    { id: 'DS-004', name: 'Apache Spark Performance Logs', accessStatus: 'Access Granted', analysisStatus: 'Validated', downloadStatus: 'Downloaded' }
  ];

  const sampleIssues = [
    { id: 'I-001', problem: 'Insufficient storage space', severity: 'High', status: 'In Progress' },
    { id: 'I-002', problem: 'Missing eBPF dependencies', severity: 'Medium', status: 'Open' },
    { id: 'I-003', problem: 'Network timeout downloading datasets', severity: 'Medium', status: 'Open' },
    { id: 'I-004', problem: 'Literature review scope too broad', severity: 'Low', status: 'Resolved' },
    { id: 'I-005', problem: 'Authentication system vulnerability', severity: 'Critical', status: 'Resolved' }
  ];

  const [tasks, setTasks] = useState(sampleTasks);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      fetch('/api/reports')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setReportData(data);
          }
        })
        .catch(() => {});

      fetch('/api/tasks')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.tasks) {
            setTasks(data.tasks);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading reports...</p>
      </div>
    );
  }

  const handleGenerateReport = (reportType: string) => {
    alert(`Generating latest ${reportType} report...`);
  };

  const handleExportReport = (format: string) => {
    if (format === 'CSV') {
      const headers = 'ID,Title,Status,Assignee,Priority,DueDate\n';
      const rows = tasks.map(t => `"${t.id}","${t.title}","${t.status}","${t.assignee}","${t.priority}","${t.dueDate || ''}"`).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PMCS_Report_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify({ tasks, reportData, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `PMCS_Report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Reports</h1>
          <div>
            <button
              onClick={() => handleExportReport('PDF')}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Export as PDF
            </button>
            <button
              onClick={() => handleExportReport('CSV')}
              style={{
                marginLeft: '0.5rem',
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Export as CSV
            </button>
          </div>
        </div>

        {/* Reports Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {/* Project Progress Report */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#212529', marginTop: 0 }}>Project Progress Report</h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Completion Status</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Completed Tasks:</span>
                  <span style={{ fontWeight: '600', color: '#28a745' }}>
                    {sampleTasks.filter(t => t.status === 'Completed').length}/{sampleTasks.length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Completion Percentage:</span>
                  <span style={{ fontWeight: '600', color: '#0d6efd' }}>
                    {Math.round((sampleTasks.filter(t => t.status === 'Completed').length / sampleTasks.length) * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>In Progress:</span>
                  <span style={{ fontWeight: '600', color: '#ffc107' }}>
                    {sampleTasks.filter(t => t.status === 'In Progress').length}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Blocked:</span>
                  <span style={{ fontWeight: '600', color: '#dc3545' }}>
                    {sampleTasks.filter(t => t.status === 'Blocked').length}
                  </span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => handleGenerateReport('Project Progress')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Member Contribution Report */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#212529', marginTop: 0 }}>Member Contribution Report</h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Contribution by Member</p>
                {sampleTeam.map(member => (
                  <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', borderBottom: '1px solid #f8f9fa' }}>
                    <span>
                      {member.name} ({member.role})
                    </span>
                    <span style={{ fontWeight: '600' }}>
                      {member.completedTasks} tasks • {member.effortPoints} effort points
                    </span>
                  </div>
                ))}
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#6c757d' }}>
                  Total effort points: {sampleTeam.reduce((sum, member) => sum + member.effortPoints, 0)}
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => handleGenerateReport('Member Contribution')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Research Report */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#212529', marginTop: 0 }}>Research Report</h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Research Status</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Papers:</span>
                  <span style={{ fontWeight: '600' }}>{sampleResearch.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Reviewed:</span>
                  <span style={{ fontWeight: '600', color: '#28a745' }}>{sampleResearch.filter(r => r.status === 'Reviewed').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Read:</span>
                  <span style={{ fontWeight: '600', color: '#17a2b8' }}>{sampleResearch.filter(r => r.status === 'Reading').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Used in Reports:</span>
                  <span style={{ fontWeight: '600', color: '#20c997' }}>{sampleResearch.filter(r => r.status === 'Used in Report').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Not Read:</span>
                  <span style={{ fontWeight: '600', color: '#6c757d' }}>{sampleResearch.filter(r => r.status === 'Not Read').length}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => handleGenerateReport('Research')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Dataset Report */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#212529', marginTop: 0 }}>Dataset Report</h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Dataset Status</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Datasets:</span>
                  <span style={{ fontWeight: '600' }}>{sampleDatasets.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Access Granted:</span>
                  <span style={{ fontWeight: '600', color: '#28a745' }}>{sampleDatasets.filter(d => d.accessStatus === 'Access Granted').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Downloaded:</span>
                  <span style={{ fontWeight: '600', color: '#28a745' }}>{sampleDatasets.filter(d => d.downloadStatus === 'Downloaded').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Analysis Complete:</span>
                  <span style={{ fontWeight: '600', color: '#28a745' }}>{sampleDatasets.filter(d => d.analysisStatus === 'Analyzed' || d.analysisStatus === 'Validated' || d.analysisStatus === 'Ready for Use').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Ready for Use:</span>
                  <span style={{ fontWeight: '600', color: '#20c997' }}>{sampleDatasets.filter(d => d.analysisStatus === 'Ready for Use').length}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => handleGenerateReport('Dataset')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {/* Issue Report */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{ color: '#212529', marginTop: 0 }}>Issue Report</h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>Issue Status</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Issues:</span>
                  <span style={{ fontWeight: '600' }}>{sampleIssues.length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Open Issues:</span>
                  <span style={{ fontWeight: '600', color: '#fd7e14' }}>{sampleIssues.filter(i => i.status === 'Open').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Resolved Issues:</span>
                  <span style={{ fontWeight: '600', color: '#28a745' }}>{sampleIssues.filter(i => i.status === 'Resolved').length}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                  <span>Critical Issues:</span>
                  <span style={{ fontWeight: '600', color: '#dc3545' }}>{sampleIssues.filter(i => i.severity === 'Critical').length}</span>
                </div>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => handleGenerateReport('Issue')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    backgroundColor: '#0d6efd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}