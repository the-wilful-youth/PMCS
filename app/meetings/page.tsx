'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sample meetings based on Chronicle_Project_Management_System.xlsx
  const initialMeetings = [
    {
      id: 'M-001',
      date: '2026-08-01',
      participants: 'Anurag, Divyanshi, Tanishk, Prajjwal',
      agenda: 'Project kickoff and initial planning',
      discussion: 'Defined project scope, identified initial tasks, assigned roles and responsibilities.',
      decisions: [
        'Project will focus on Linux performance analysis',
        'Anurag assigned as Project Admin',
        'Initial task breakdown approved',
        'Weekly sync meetings scheduled for Mondays at 10 AM'
      ],
      actionItems: [
        {
          description: 'Create project repository and initial documentation',
          assignee: 'Anurag',
          deadline: '2026-08-03',
          completed: true
        },
        {
          description: 'Research Linux performance analysis tools and techniques',
          assignee: 'Divyanshi',
          deadline: '2026-08-10',
          completed: true
        },
        {
          description: 'Define literature review methodology and sources',
          assignee: 'Tanishk',
          deadline: '2026-08-08',
          completed: true
        },
        {
          description: 'Identify potential Linux datasets for performance analysis',
          assignee: 'Prajjwal',
          deadline: '2026-08-07',
          completed: true
        }
      ],
      owner: 'Anurag',
      notes: 'Successful kickoff meeting with clear action items and next steps.',
      recordingLink: 'https://drive.google.com/file/d/meeting-recording-001/view',
      attachments: [
        {
          name: 'Project-Charter-Draft-v0.1.pdf',
          url: 'https://drive.google.com/file/d/charter-draft-001/view'
        }
      ]
    },
    {
      id: 'M-002',
      date: '2026-08-08',
      participants: 'Anurag, Divyanshi, Tanishk, Prajjwal',
      agenda: 'Literature review findings and dataset selection approach',
      discussion: 'Reviewed literature findings, evaluated potential datasets, defined selection criteria.',
      decisions: [
        'Will use ISCX VPN-Tor dataset for network traffic classification',
        'Will focus on eBPF and tracepoints for kernel performance analysis',
        'Adopted Apache Spark for preprocessing pipeline',
        'Literature review to be completed by August 25th'
      ],
      actionItems: [
        {
          description: 'Download and validate ISCX VPN-Tor dataset',
          assignee: 'Divyanshi',
          deadline: '2026-08-15',
          completed: false
        },
        {
          description: 'Set up Apache Spark cluster for preprocessing',
          assignee: 'Anurag',
          deadline: '2026-08-20',
          completed: false
        },
        {
          description: 'Create eBPF performance monitoring scripts',
          assignee: 'Tanishk',
          deadline: '2026-08-18',
          completed: false
        },
        {
          description: 'Finalize literature review document',
          assignee: 'Prajjwal',
          deadline: '2026-08-25',
          completed: false
        }
      ],
      owner: 'Divyanshi',
      notes: 'Good progress on research phase, clear direction for next steps.',
      recordingLink: 'https://drive.google.com/file/d/meeting-recording-002/view',
      attachments: [
        {
          name: 'Literature-Review-Findings-Aug8.pdf',
          url: 'https://drive.google.com/file/d/lit-review-findings-002/view'
        },
        {
          name: 'Dataset-Evaluation-Criteria.pdf',
          url: 'https://drive.google.com/file/d/dataset-criteria-002/view'
        }
      ]
    },
    {
      id: 'M-003',
      date: '2026-08-15',
      participants: 'Anurag, Divyanshi, Tanishk',
      agenda: 'Dataset acquisition progress and preprocessing planning',
      discussion: 'Reviewed dataset download status, discussed preprocessing approach, identified blockers.',
      decisions: [
        'Dataset download proceeding as expected',
        'Will use Python with Pandas for initial data cleaning',
        'Blocker: Need additional storage space for large datasets',
        'Next meeting: Dataset validation and preprocessing start'
      ],
      actionItems: [
        {
          description: 'Request additional storage allocation from IT',
          assignee: 'Prajjwal',
          deadline: '2026-08-18',
          completed: false
        },
        {
          description: 'Create initial data cleaning scripts',
          assignee: 'Divyanshi',
          deadline: '2026-08-22',
          completed: false
        },
        {
          description: 'Design preprocessing workflow architecture',
          assignee: 'Anurag',
          deadline: '2026-08-20',
          completed: false
        }
      ],
      owner: 'Tanishk',
      notes: 'Blocker identified regarding storage space - needs immediate attention.',
      recordingLink: 'https://drive.google.com/file/d/meeting-recording-003/view',
      attachments: [
        {
          name: 'Dataset-Acquisition-Status-Aug15.pdf',
          url: 'https://drive.google.com/file/d/dataset-status-003/view'
        }
      ]
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setMeetings(initialMeetings);
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddMeeting = () => {
    router.push('/meetings/new');
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Meetings</h1>
          <div>
            <button
              onClick={handleAddMeeting}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Schedule Meeting
            </button>
          </div>
        </div>

        {/* Meetings List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {meetings.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
              <p>No meetings found</p>
            </div>
          ) : (
            <div style={{ padding: '1.5rem' }}>
              {meetings.map((meeting) => (
                <div key={meeting.id} style={{ borderBottom: '1px solid #eee', padding: '2rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                        Meeting on {meeting.date}
                      </h3>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        <strong>Participants:</strong> {meeting.participants}
                      </p>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        <strong>Agenda:</strong> {meeting.agenda}
                      </p>
                      <p style={{ margin: '0 0 0.5rem 0', color: '#6c757d', fontSize: '0.9rem' }}>
                        <strong>Discussion:</strong> {meeting.discussion}
                      </p>

                      {/* Decisions */}
                      {meeting.decisions && meeting.decisions.length > 0 && (
                        <div style={{ margin: '1rem 0' }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#212529', fontWeight: 600 }}>
                            Decisions:
                          </p>
                          <ul style={{ margin: '0 0 1rem 0', paddingLeft: '1.5rem' }}>
                            {meeting.decisions.map((decision: any, index: number) => (
                              <li key={index} style={{ margin: '0.25rem 0', color: '#6c757d' }}>
                                {decision}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Action Items */}
                      {meeting.actionItems && meeting.actionItems.length > 0 && (
                        <div style={{ margin: '1rem 0' }}>
                          <p style={{ margin: '0 0 0.5rem 0', color: '#212529', fontWeight: 600 }}>
                            Action Items:
                          </p>
                          {meeting.actionItems.map((item: any, index: number) => (
                            <div key={index} style={{ border: '1px solid #e9ecef', borderRadius: '4px', padding: '0.75rem', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                  <p style={{ margin: '0 0 0.25rem 0', color: '#212529', fontWeight: 600 }}>
                                    {item.description}
                                  </p>
                                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#6c757d' }}>
                                    <strong>Assignee:</strong> {item.assignee} |
                                    <strong>Due:</strong> {item.deadline} |
                                    <strong>Status:</strong>
                                    <span style={{
                                      backgroundColor: item.completed ? '#d4edda' : '#f8d7da',
                                      color: item.completed ? '#155724' : '#721c24',
                                      padding: '0.25rem 0.5rem',
                                      borderRadius: '3px',
                                      fontSize: '0.75rem'
                                    }}>
                                      {item.completed ? 'Completed' : 'Pending'}
                                    </span>
                                  </p>
                                </div>
                                <div style={{ textAlign: 'center', minWidth: '60px' }}>
                                  {item.completed ? (
                                    <span style={{
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '50%',
                                      fontSize: '0.75rem'
                                    }}>
                                      ✓
                                    </span>
                                  ) : (
                                    <span style={{
                                      backgroundColor: '#ffc107',
                                      color: '#212529',
                                      width: '24px',
                                      height: '24px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '50%',
                                      fontSize: '0.75rem'
                                    }}>
                                      ○
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Meeting Metadata */}
                      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6c757d' }}>
                        <strong>Owner:</strong> {meeting.owner} |
                        <strong>Recording:</strong>
                        {meeting.recordingLink ? (
                          <a
                            href={meeting.recordingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#0d6efd', textDecoration: 'underline' }}
                          >
                            View Recording
                          </a>
                        ) : 'None Available'}
                      </div>

                      {/* Attachments */}
                      {meeting.attachments && meeting.attachments.length > 0 && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <p style={{ margin: '0 0 0.25rem 0', color: '#6c757d', fontWeight: 600 }}>
                            Attachments:
                          </p>
                          {meeting.attachments.map((attachment: any, index: number) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                                {attachment.name}
                              </span>
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.5rem',
                                  backgroundColor: '#0d6efd',
                                  color: 'white',
                                  textDecoration: 'none',
                                  borderRadius: '3px',
                                  fontSize: '0.75rem'
                                }}
                              >
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {meeting.notes && (
                        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                          <p style={{ margin: '0', color: '#6c757d', fontStyle: 'italic' }}>
                            <strong>Notes:</strong> {meeting.notes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '0.25rem' }}>
                        <strong>Meeting ID:</strong> {meeting.id}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        <strong>Created:</strong> {meeting.date}
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