'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, logout, User } from '@/lib/auth';

export function HomePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    } else {
      setCurrentUser(getCurrentUser());
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#495057',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            width: '2.5rem',
            height: '2.5rem',
            border: '3px solid #dee2e6',
            borderTopColor: '#0d6efd',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>Verifying session...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#212529',
      padding: '2rem 1.5rem'
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
        border: '1px solid #e9ecef',
        overflow: 'hidden'
      }}>
        {/* Top Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 2rem',
          borderBottom: '1px solid #dee2e6',
          backgroundColor: '#ffffff'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0d6efd',
              letterSpacing: '-0.02em'
            }}>
              Project Manager Portal
            </h1>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6c757d' }}>
              Centralized Academic &amp; Software Project Operating Workspace
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                {currentUser?.name || 'Authorized Member'}
              </div>
              <span style={{
                display: 'inline-block',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
                backgroundColor: currentUser?.role === 'admin' ? '#cff4fc' : '#e2e3e5',
                color: currentUser?.role === 'admin' ? '#055160' : '#383d41'
              }}>
                {currentUser?.role === 'admin' ? 'Project Admin' : 'Team Member'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#dc3545',
                backgroundColor: '#fff',
                border: '1px solid #dc3545',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#dc3545';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#dc3545';
              }}
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <section style={{ padding: '2rem' }}>
          <div style={{
            padding: '1.25rem',
            backgroundColor: '#e7f1ff',
            borderRadius: '8px',
            border: '1px solid #b6d4fe',
            marginBottom: '2rem'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', color: '#084298' }}>
              Welcome back, {currentUser?.name || 'User'}!
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#0a58ca' }}>
              Your session is securely authenticated. Role-based access and route security guards are active.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem'
          }}>
            <div style={{
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                Health Status
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#198754', marginTop: '0.5rem' }}>
                ON TRACK
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                All systems active and responsive
              </p>
            </div>

            <div style={{
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                Security &amp; Auth
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0d6efd', marginTop: '0.5rem' }}>
                Protected
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                Server-side cookies, CSP &amp; HSTS active
              </p>
            </div>

            <div style={{
              padding: '1.25rem',
              backgroundColor: '#ffffff',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#6c757d', fontWeight: 600, textTransform: 'uppercase' }}>
                Active Team
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#212529', marginTop: '0.5rem' }}>
                4 Members
              </div>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#6c757d' }}>
                Anurag, Divyanshi, Tanishk, Prajjwal
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HomePage;