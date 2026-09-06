'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchQuery = searchParams.get('q') || '';
    if (searchQuery) {
      setQuery(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) {
        throw new Error(`Search failed: ${res.status}`);
      }
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to perform search');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as React.FormEvent);
    }
  };

  if (query === '' && searchParams.get('q') === null) {
    // Show empty search page
    return (
      <div style={{ minHeight: '100vh', padding: '4rem 2rem', backgroundColor: '#f8f9fa' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ color: '#212529', marginBottom: '1.5rem' }}>Search PMCS</h1>
          <p style={{ color: '#6c757d', marginBottom: '2rem' }}>
            Search for projects, tasks, documents, research, datasets, meetings, and more
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search everything..."
              onKeyPress={handleKeyPress}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '1px solid #ced4da',
                borderRadius: '6px 0 0 6px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 600,
                color: 'white',
                backgroundColor: '#0d6efd',
                border: 'none',
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#212529' }}>Search Results for "{query}"</h1>
          <div>
            {results.length > 0 && (
              <span style={{ color: '#6c757d' }}>
                {results.length} result{results.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {isLoading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ display: 'inline-block', width: '3rem', height: '3rem', border: '3px solid #dee2e6', borderTopColor: '#0d6efd', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: '#6c757d' }}>Searching...</p>
          </div>
        )}

        {results.length === 0 && !isLoading && !error && query !== '' && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#6c757d' }}>
            <p>No results found for "{query}"</p>
            <p>Try a different search term or check your spelling</p>
          </div>
        )}

        {results.length > 0 && !isLoading && (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {results.map((result: any) => (
              <div
                key={result.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  border: '1px solid #e9ecef',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#212529', flexGrow: 1 }}>
                      {result.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          padding: '0.25rem 0.5rem',
                          backgroundColor: getTypeColor(result.type),
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      </span>
                      {result.projectName && (
                        <span
                          style={{
                            fontSize: '0.85rem',
                            color: '#6c757d',
                            marginLeft: '0.5rem',
                          }}
                        >
                          in {result.projectName}
                        </span>
                      )}
                    </div>
                  </div>
                  {result.description && (
                    <p style={{ margin: '0 0 1rem 0', color: '#6c757d', lineHeight: '1.5' }}>
                      {result.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.85rem', color: '#adb5bd' }}>
                    <span>{new Date(result.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', textAlign: 'right' }}>
                  <button
                    onClick={() => router.push(result.link)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#0d6efd',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    project: '#0d6efd',
    task: '#198754',
    milestone: '#ffc107',
    issue: '#dc3545',
    document: '#6f42c1',
    research: '#fd7e14',
    dataset: '#20c997',
    meeting: '#6610f2',
  };
  return colors[type] || '#6c757d';
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}