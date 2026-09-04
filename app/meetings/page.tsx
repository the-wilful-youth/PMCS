'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '@/lib/auth';

export default function MeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add Meeting Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: '',
    time: '14:00 - 15:00',
    agenda: '',
    discussionNotes: '',
    actionItemText: '',
    actionItemAssignee: 'Anurag',
  });

  const loadMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings);
      }
    } catch (err) {
      console.error('Failed to load meetings:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      loadMeetings().finally(() => setIsLoading(false));
    }
  }, []);

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.title.trim()) return;

    setIsSubmitting(true);
    try {
      const actionItems = newMeeting.actionItemText.trim() ? [{
        id: `ai-${Date.now()}`,
        text: newMeeting.actionItemText.trim(),
        assignee: newMeeting.actionItemAssignee,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isCompleted: false,
      }] : [];

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newMeeting.title,
          date: newMeeting.date || new Date().toISOString().split('T')[0],
          time: newMeeting.time,
          attendees: ['Anurag', 'Divyanshi', 'Tanishk', 'Prajjwal'],
          agenda: newMeeting.agenda,
          discussionNotes: newMeeting.discussionNotes,
          actionItems,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setNewMeeting({
          title: '',
          date: '',
          time: '14:00 - 15:00',
          agenda: '',
          discussionNotes: '',
          actionItemText: '',
          actionItemAssignee: 'Anurag',
        });
        await loadMeetings();
      }
    } catch (err) {
      console.error('Failed to save meeting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToTask = async (meetingId: string, actionItemId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/convert-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionItemId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Action item converted to Task ${data.task.id}!`);
        await loadMeetings();
      } else {
        alert(data.error || 'Failed to convert action item');
      }
    } catch (err) {
      console.error('Failed to convert action item:', err);
    }
  };

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm(`Are you sure you want to delete meeting ${id}?`)) return;
    try {
      const res = await fetch(`/api/meetings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMeetings(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete meeting:', err);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: '#6c757d' }}>
        <p>Loading meeting minutes and agendas...</p>
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ color: '#212529', margin: 0, fontSize: '1.75rem', fontWeight: 700 }}>Meeting Records & Minutes</h1>
            <p style={{ margin: '0.25rem 0 0', color: '#6c757d', fontSize: '0.9rem' }}>
              Agendas, notes, decisions, and convertible action items
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
            + Record Meeting
          </button>
        </div>

        {/* Meetings List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {meetings.map(m => (
            <div key={m.id} style={{ backgroundColor: 'white', borderRadius: '10px', border: '1px solid #dee2e6', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0d6efd', backgroundColor: '#e7f1ff', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                      {m.id}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#212529' }}>{m.title}</h3>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                    📅 {m.date} • ⏰ {m.time} • 👥 Attendees: {m.attendees?.join(', ')}
                  </div>
                </div>

                {currentUser?.role === 'admin' && (
                  <button
                    onClick={() => handleDeleteMeeting(m.id)}
                    style={{ backgroundColor: 'transparent', color: '#dc3545', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                )}
              </div>

              {m.agenda && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#495057' }}>Agenda: </span>
                  <span style={{ fontSize: '0.85rem', color: '#6c757d' }}>{m.agenda}</span>
                </div>
              )}

              {m.discussionNotes && (
                <div style={{ backgroundColor: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem', color: '#333' }}>
                  <strong>Discussion & Summary:</strong> {m.discussionNotes}
                </div>
              )}

              {/* Action Items */}
              {m.actionItems && m.actionItems.length > 0 && (
                <div style={{ borderTop: '1px solid #f1f3f5', paddingTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#495057' }}>Action Items:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {m.actionItems.map((ai: any) => (
                      <div
                        key={ai.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: '#fdfdfe',
                          border: '1px solid #e9ecef',
                          borderRadius: '6px',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.85rem', color: '#212529' }}>{ai.text}</span>
                          <span style={{ fontSize: '0.75rem', color: '#6c757d', marginLeft: '0.75rem' }}>
                            (Assignee: {ai.assignee} • Due: {ai.dueDate})
                          </span>
                        </div>

                        <div>
                          {ai.convertedToTaskId ? (
                            <span style={{ fontSize: '0.75rem', backgroundColor: '#d4edda', color: '#155724', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                              ✓ Converted to {ai.convertedToTaskId}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConvertToTask(m.id, ai.id)}
                              style={{
                                backgroundColor: '#0d6efd',
                                color: 'white',
                                border: 'none',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                fontWeight: 500,
                              }}
                            >
                              ⚡ Convert to Task
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.3rem' }}>Record Meeting</h2>
              <form onSubmit={handleCreateMeeting}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Title *</label>
                  <input
                    type="text"
                    required
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder="e.g. Weekly Standup & Pipeline Check"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Date</label>
                    <input
                      type="date"
                      value={newMeeting.date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Time</label>
                    <input
                      type="text"
                      value={newMeeting.time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, time: e.target.value })}
                      placeholder="14:00 - 15:00"
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Agenda</label>
                  <input
                    type="text"
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                    placeholder="Review deliverables, unblock dataset approval"
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Discussion Notes</label>
                  <textarea
                    rows={2}
                    value={newMeeting.discussionNotes}
                    onChange={(e) => setNewMeeting({ ...newMeeting, discussionNotes: e.target.value })}
                    placeholder="Summary of decisions and findings..."
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #ced4da' }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem', backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '6px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem' }}>Action Item</label>
                  <input
                    type="text"
                    value={newMeeting.actionItemText}
                    onChange={(e) => setNewMeeting({ ...newMeeting, actionItemText: e.target.value })}
                    placeholder="e.g. Follow up on Cambridge repository credentials"
                    style={{ width: '100%', padding: '0.45rem', borderRadius: '4px', border: '1px solid #ced4da', marginBottom: '0.5rem' }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#495057' }}>Assignee:</span>
                    <select
                      value={newMeeting.actionItemAssignee}
                      onChange={(e) => setNewMeeting({ ...newMeeting, actionItemAssignee: e.target.value })}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ced4da' }}
                    >
                      <option value="Anurag">Anurag</option>
                      <option value="Divyanshi">Divyanshi</option>
                      <option value="Tanishk">Tanishk</option>
                      <option value="Prajjwal">Prajjwal</option>
                    </select>
                  </div>
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
                    {isSubmitting ? 'Saving...' : 'Save Meeting'}
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