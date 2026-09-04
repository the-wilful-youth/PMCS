'use client';

import { useEffect } from 'react';
import { isAuthenticated } from '../lib/auth';

export function HomePage() {
  useEffect(() => {
    // Check if user is authenticated, if not redirect to login
    if (typeof window !== 'undefined' && !isAuthenticated()) {
      window.location.href = '/login';
    }
  }, []);

  if (typeof window === 'undefined') {
    // Show loading state during SSR
    return <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>Loading...</main>;
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Project Manager Portal</h1>
      <p>Welcome to the MVP. This is the landing page.</p>
      <p>Hello, {window.localStorage.getItem('username') || 'User'}!</p>
      <button onClick={() => {
        window.localStorage.removeItem('isAuthenticated');
        window.localStorage.removeItem('username');
        window.location.href = '/login';
      }} style={{ marginTop: '1rem' }}>
        Logout
      </button>
    </main>
  );
}

export default HomePage;