'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, logout } from '@/lib/auth';

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Sample events based on project data
  const sampleEvents = [
    {
      id: 'E-001',
      title: 'Project Kickoff Meeting',
      date: '2026-08-01',
      time: '10:00 AM',
      type: 'meeting',
      description: 'Initial project planning and task assignment'
    },
    {
      id: 'E-002',
      title: 'Set up project workspace',
      date: '2026-08-01',
      time: 'All Day',
      type: 'task-deadline',
      description: 'Create shared project folders and tracker'
    },
    {
      id: 'E-003',
      title: 'Literature review methodology meeting',
      date: '2026-08-08',
      time: '2:00 PM',
      type: 'meeting',
      description: 'Define literature review approach and sources'
    },
    {
      id: 'E-004',
      title: 'Finalize Linux datasets',
      date: '2026-09-20',
      time: 'All Day',
      type: 'task-deadline',
      description: 'Select final datasets for Chronicle'
    },
    {
      id: 'E-005',
      title: 'Dataset acquisition deadline',
      date: '2026-09-30',
      time: 'All Day',
      type: 'task-deadline',
      description: 'Download/request access to selected datasets'
    },
    {
      id: 'E-006',
      title: 'Preprocessing pipeline deadline',
      date: '2026-10-05',
      time: 'All Day',
      type: 'task-deadline',
      description: 'Prepare scripts for cleaning and preprocessing'
    },
    {
      id: 'E-007',
      title: 'Milestone: Linux Dataset Selection Complete',
      date: '2026-08-20',
      time: 'All Day',
      type: 'milestone',
      description: 'Finalize selection of Linux datasets for performance analysis'
    },
    {
      id: 'E-008',
      title: 'Milestone: Literature Review Completed',
      date: '2026-08-25',
      time: 'All Day',
      type: 'milestone',
      description: 'Finish comprehensive literature review on Linux performance analysis'
    }
  ];

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setEvents(sampleEvents);
      setIsLoading(false);

      Promise.all([
        fetch('/api/tasks').then(r => r.ok ? r.json() : null),
        fetch('/api/meetings').then(r => r.ok ? r.json() : null),
        fetch('/api/milestones').then(r => r.ok ? r.json() : null),
      ]).then(([tasksData, meetingsData, msData]) => {
        const liveEvents: any[] = [];

        if (tasksData?.tasks) {
          tasksData.tasks.forEach((t: any) => {
            if (t.dueDate) {
              liveEvents.push({
                id: `E-${t.id}`,
                title: `${t.title} (Deadline)`,
                date: t.dueDate,
                time: 'All Day',
                type: 'task-deadline',
                description: t.description || `Due date for task ${t.id}`,
              });
            }
          });
        }

        if (meetingsData?.meetings) {
          meetingsData.meetings.forEach((m: any) => {
            liveEvents.push({
              id: `E-${m.id}`,
              title: m.title,
              date: m.date,
              time: m.time || '14:00',
              type: 'meeting',
              description: m.agenda || 'Project Meeting',
            });
          });
        }

        if (msData?.milestones) {
          msData.milestones.forEach((ms: any) => {
            if (ms.targetDate) {
              liveEvents.push({
                id: `E-${ms.id}`,
                title: `Milestone: ${ms.name}`,
                date: ms.targetDate,
                time: 'All Day',
                type: 'milestone',
                description: ms.description || 'Target date for milestone',
              });
            }
          });
        }

        if (liveEvents.length > 0) {
          setEvents(liveEvents);
        }
      }).catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleAddEvent = () => {
    alert('Event creation functionality would be implemented here');
  };

  const handlePrevPeriod = () => {
    if (view === 'month') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() - 1);
        return newDate;
      });
    } else if (view === 'week') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 7);
        return newDate;
      });
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() - 1);
        return newDate;
      });
    }
  };

  const handleNextPeriod = () => {
    if (view === 'month') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(prev.getMonth() + 1);
        return newDate;
      });
    } else if (view === 'week') {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 7);
        return newDate;
      });
    } else {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setDate(prev.getDate() + 1);
        return newDate;
      });
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Loading calendar...</p>
      </div>
    );
  }

  // Filter events for current view
  const visibleEvents = getVisibleEvents(events, currentDate, view);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529', margin: 0 }}>Calendar</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrevPeriod}
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                cursor: 'pointer'
              }}
            >
              ‹ Previous
            </button>
            <div>
              <button
                onClick={() => setView('month')}
                className={view === 'month' ? 'active-view' : ''}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #dee2e6',
                  backgroundColor: view === 'month' ? '#0d6efd' : 'white',
                  color: view === 'month' ? 'white' : '#212529',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={view === 'week' ? 'active-view' : ''}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #dee2e6',
                  backgroundColor: view === 'week' ? '#0d6efd' : 'white',
                  color: view === 'week' ? 'white' : '#212529',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={view === 'day' ? 'active-view' : ''}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #dee2e6',
                  backgroundColor: view === 'day' ? '#0d6efd' : 'white',
                  color: view === 'day' ? 'white' : '#212529',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Day
              </button>
              <span style={{ margin: '0 1rem', fontWeight: 600, color: '#212529' }}>
                {formatDateHeader(currentDate, view)}
              </span>
              <button
                onClick={handleNextPeriod}
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer'
                }}
              >
                Next ›
              </button>
            </div>
            <button
              onClick={handleAddEvent}
              style={{
                backgroundColor: '#0d6efd',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Add Event
            </button>
          </div>
        </div>

        {/* Calendar View */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '1.5rem' }}>
            {view === 'month' ? (
              <MonthView events={visibleEvents} currentDate={currentDate} />
            ) : view === 'week' ? (
              <WeekView events={visibleEvents} currentDate={currentDate} />
            ) : (
              <DayView events={visibleEvents} currentDate={currentDate} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper function to format date header
const formatDateHeader = (date: Date, view: string): string => {
  if (view === 'month') {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  } else if (view === 'week') {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    const end = new Date(date);
    end.setDate(date.getDate() + (6 - date.getDay()));
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  } else {
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }
};

// Helper function to get visible events based on view
const getVisibleEvents = (events: any[], date: Date, view: string): any[] => {
  if (view === 'month') {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    });
  } else if (view === 'week') {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(date);
    endOfWeek.setDate(date.getDate() + (6 - date.getDay()));
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  } else {
    const today = new Date(date);
    today.setHours(0, 0, 0, 0);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === today.getTime();
    });
  }
};

// Component for month view
const MonthView = ({ events, currentDate }: { events: any[]; currentDate: Date }) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startingDay = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const days = [];
  // Add empty cells for days before the 1st
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} style={{ height: '80px' }}></div>);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(event => event.date === dateStr);
    const isToday = day === currentDate.getDate() &&
                   currentDate.getMonth() === new Date().getMonth() &&
                   currentDate.getFullYear() === new Date().getFullYear();

    days.push(
      <div key={`day-${day}`} style={{
        border: '1px solid #dee2e6',
        minHeight: '80px',
        padding: '0.5rem',
        position: 'relative',
        backgroundColor: isToday ? '#e7f1ff' : 'white'
      }}>
        <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
          {day}
        </div>
        {dayEvents.map((event, index) => (
          <div key={`event-${index}`} style={{
            marginTop: '0.25rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: getEventTypeColor(event.type),
            color: 'white',
            fontSize: '0.75rem',
            borderRadius: '3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {event.title}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0' }}>
      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
        <div key={day} style={{
          textAlign: 'center',
          padding: '0.5rem',
          fontWeight: '600',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6'
        }}>
          {day}
        </div>
      ))}
      {days}
    </div>
  );
};

// Component for week view
const WeekView = ({ events, currentDate }: { events: any[]; currentDate: Date }) => {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
      {days.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const dayEvents = events.filter(event => event.date === dateStr);
        const isToday = date.getDate() === new Date().getDate() &&
                       date.getMonth() === new Date().getMonth() &&
                       date.getFullYear() === new Date().getFullYear();

        return (
          <div key={index} style={{ border: '1px solid #dee2e6' }}>
            <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>
              <div style={{ fontWeight: '600' }}>
                {day}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                {date.getDate()}
              </div>
              {isToday && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  right: '0',
                  backgroundColor: '#0d6efd',
                  color: 'white',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '3px',
                  fontSize: '0.75rem'
                }}>
                  Today
                </div>
              )}
            </div>
            <div style={{ padding: '0.5rem', minHeight: '100px' }}>
              {dayEvents.map((event, index) => (
                <div key={`event-${index}`} style={{
                  marginBottom: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: getEventTypeColor(event.type),
                  color: 'white',
                  fontSize: '0.75rem',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {event.title} {event.time !== 'All Day' && `(${event.time})`}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Component for day view
const DayView = ({ events, currentDate }: { events: any[]; currentDate: Date }) => {
  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const dayEvents = events.filter(event => event.date === dateStr);
  const isToday = currentDate.getDate() === new Date().getDate() &&
                 currentDate.getMonth() === new Date().getMonth() &&
                 currentDate.getFullYear() === new Date().getFullYear();

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>
          {isToday ? 'Today' : currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        {isToday && (
          <span style={{
            backgroundColor: '#0d6efd',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '3px',
            fontSize: '0.875rem'
          }}>
            Today
          </span>
        )}
      </div>
      {dayEvents.length === 0 ? (
        <p style={{ color: '#6c757d', textAlign: 'center', padding: '2rem' }}>
          No events scheduled for this day
        </p>
      ) : (
        <div>
          {dayEvents.map((event, index) => (
            <div key={index} style={{ borderBottom: '1px solid #eee', padding: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#212529' }}>
                    {event.title}
                  </h4>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      backgroundColor: getEventTypeColor(event.type),
                      color: 'white',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '3px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {event.time}
                  </span>
                </div>
              </div>
              <p style={{ margin: '0.5rem 0 0 0', color: '#6c757d' }}>
                {event.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to get event type color
const getEventTypeColor = (type: string): string => {
  switch (type) {
    case 'meeting': return '#0d6efd';
    case 'task-deadline': return '#28a745';
    case 'milestone': return '#ffc107';
    default: return '#6c757d';
  }
};