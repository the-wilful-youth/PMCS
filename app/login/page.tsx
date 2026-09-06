'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, isAuthenticated } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign in fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Sign up additional fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Verify server session directly to prevent infinite bounce loops between client and proxy.ts
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.replace('/');
        } else {
          try {
            window.localStorage.removeItem('isAuthenticated');
            window.localStorage.removeItem('username');
            window.localStorage.removeItem('userRole');
            window.localStorage.removeItem('userName');
            window.localStorage.removeItem('pmcs_session');
          } catch {}
        }
      })
      .catch(() => {});
  }, [router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        router.replace('/');
      } else {
        setError(result.error || 'Authentication failed. Please check your credentials.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const result = await signup(username, password, name, email);

      if (result.success) {
        setSuccess('Account created successfully! Redirecting to workspace...');
        setTimeout(() => {
          router.replace('/');
        }, 500);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#212529',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '1px solid #e9ecef',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#0d6efd',
              letterSpacing: '-0.02em',
            }}
          >
            Project Manager
          </h1>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>
            {mode === 'signin'
              ? 'Sign in to access your project workspace'
              : 'Register a new account to manage or collaborate on projects'}
          </p>
        </div>

        {/* Mode switch link */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          {mode === 'signin' ? (
            <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccess(null);
                  setIsLoading(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#0d6efd',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Create an Account
              </button>
            </span>
          ) : (
            <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError(null);
                  setSuccess(null);
                  setIsLoading(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#0d6efd',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Back to Login
              </button>
            </span>
          )}
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
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#d1e7dd',
              color: '#0f5132',
              border: '1px solid #badbcc',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {success}
          </div>
        )}

        {mode === 'signin' ? (
          <form onSubmit={handleSignIn} noValidate>
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
                  boxSizing: 'border-box',
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
                  boxSizing: 'border-box',
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
                transition: 'background-color 0.15s ease',
              }}
            >
              {isLoading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} noValidate>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="signup-name-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Full Name
              </label>
              <input
                id="signup-name-input"
                type="text"
                value={name}
                maxLength={100}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. Alex Morgan"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.95rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="signup-username-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Username
              </label>
              <input
                id="signup-username-input"
                type="text"
                autoComplete="username"
                value={username}
                maxLength={64}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. alexmorgan"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.95rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="signup-email-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Email Address
              </label>
              <input
                id="signup-email-input"
                type="email"
                autoComplete="email"
                value={email}
                maxLength={100}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="e.g. alex@example.com"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.95rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="signup-password-input"
                style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Password
              </label>
              <input
                id="signup-password-input"
                type="password"
                autoComplete="new-password"
                value={password}
                maxLength={128}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Minimum 6 characters"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.95rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  outline: 'none',
                  boxSizing: 'border-box',
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
                transition: 'background-color 0.15s ease',
              }}
            >
              {isLoading ? 'Registering...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}