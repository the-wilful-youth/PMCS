'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Minor async tick for UX responsiveness and brute-force pacing
    await new Promise((resolve) => setTimeout(resolve, 200));

    const result = await login(username, password);

    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Authentication failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#212529'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#ffffff',
        padding: '2.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.75rem',
            fontWeight: 700,
            color: '#0d6efd',
            letterSpacing: '-0.02em'
          }}>
            Project Manager
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            Sign in to access your project workspace
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#f8d7da',
              color: '#842029',
              border: '1px solid #f5c2c7',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="username-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Username
            </label>
            <input
              id="username-input"
              type="text"
              autoComplete="username"
              value={username}
              maxLength={64}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="e.g. anurag"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                fontSize: '0.95rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password-input"
              style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Password
            </label>
            <input
              id="password-input"
              type="password"
              autoComplete="current-password"
              value={password}
              maxLength={128}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                fontSize: '0.95rem',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              fontWeight: 600,
              backgroundColor: isLoading ? '#6c757d' : '#0d6efd',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '1.75rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          fontSize: '0.8rem',
          color: '#495057'
        }}>
          <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#212529' }}>
            Initial Team Credentials (from project.md):
          </strong>
          <ul style={{ margin: '0.25rem 0 0 0', paddingLeft: '1.25rem', lineHeight: '1.5' }}>
            <li><strong>Admin:</strong> <code>anurag</code> / <code>Admin@123456</code></li>
            <li><strong>Member:</strong> <code>divyanshi</code>, <code>tanishk</code>, or <code>prajjwal</code> / <code>Member@123456</code></li>
          </ul>
        </div>
      </div>
    </main>
  );
}