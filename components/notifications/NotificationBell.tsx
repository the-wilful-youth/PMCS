'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Array<any>>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      setIsLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications?unread=true&limit=50');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.length);
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      // In a real app, we would update each notification to read via API
      // For now, we'll just update the state optimistically
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Navigate to the linked page
    router.push(notification.link);
    handleClose();
    // Optionally mark as read on navigation
    // (we could update via API, but for simplicity we'll do it optimistically)
    setNotifications(notifications.map(n =>
      n.id === notification.id ? { ...n, isRead: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div>
      <button
        aria-label="Notifications"
        onClick={handleClick}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '3rem',
          height: '3rem',
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 text-gray-600 hover:text-gray-900"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.042c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0A11.972 11.972 0 0021.75 8v-.75c0-4.622-2.884-8.55-6.774-9.33a12.328 12.328 0 00-4.167-.33A12.328 12.328 0 004.417 2.25a12.346 12.346 0 00-4.167.33C2.884 5.65 0 9.577 0 10.25v.75a8.967 8.967 0 01-2.312 6.042c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 005.714 0M12 15a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '-0.5rem',
              right: '-0.5rem',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              padding: '0.2rem 0.5rem',
              fontSize: '0.75rem',
              minWidth: '1.5rem',
              textAlign: 'center',
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {anchorEl && (
        <div
          style={{
            position: 'absolute',
            top: '3.5rem',
            right: '0',
            width: '320px',
            backgroundColor: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid #e9ecef' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#0d6efd',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                }}
              >
                Mark all as read
              </button>
            )}
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
                No notifications
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                {notifications.map((notification: any) => (
                  <li
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      backgroundColor: notification.isRead ? 'white' : '#f8f9fa',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>
                      {/* Notification icon based on eventType */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 text-gray-500"
                      >
                        {notification.eventType.includes('task') && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        )}
                        {notification.eventType.includes('meeting') && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        )}
                        {notification.eventType.includes('milestone') && (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 7h18M3 12h18M3 17h18"
                          />
                        )}
                        {/* Default icon */}
                        {!notification.eventType.includes('task') &&
                          !notification.eventType.includes('meeting') &&
                          !notification.eventType.includes('milestone') && (
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zm0 10c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2z"
                            />
                          )}
                      </svg>
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600 }}>
                        {notification.objectName || notification.objectType}
                      </p>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#6c757d' }}>
                        {/* Format message based on eventType */}
                        {getNotificationMessage(notification.eventType, notification)}
                      </p>
                      <p style={{ margin: '0', fontSize: '0.75rem', color: '#adb5bd' }}>
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div style={{ padding: '1rem', textAlign: 'right', borderTop: '1px solid #e9ecef' }}>
            <button
              onClick={handleClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationMessage(eventType: string, notification: any): string {
  switch (eventType) {
    case 'task_assigned':
      return `You were assigned a new task: "${notification.objectName}"`;
    case 'task_due_soon':
      return `Task "${notification.objectName}" is due soon`;
    case 'task_overdue':
      return `Task "${notification.objectName}" is overdue`;
    case 'task_completed':
      return `Task "${notification.objectName}" has been completed`;
    case 'task_blocked':
      return `Task "${notification.objectName}" is blocked`;
    case 'meeting_assigned':
      return `You have been assigned to a meeting: "${notification.objectName}"`;
    case 'meeting_reminder':
      return `Meeting "${notification.objectName}" is starting soon`;
    case 'milestone_achieved':
      return `Milestone "${notification.objectName}" has been achieved`;
    case 'milestone_delayed':
      return `Milestone "${notification.objectName}" is delayed`;
    default:
      return `You have a new notification: ${notification.objectName}`;
  }
}