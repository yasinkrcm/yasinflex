'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import { searchMulti, type TMDBMovie } from '@/lib/tmdb';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q: string, p: number) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await searchMulti(q, p);
      setResults(prev => p === 1 ? data.results.filter(r => r.media_type !== 'person') : [...prev, ...data.results.filter(r => r.media_type !== 'person')]);
      setTotalPages(data.total_pages);
      setSearched(true);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setInputVal(initialQuery);
      setPage(1);
      setResults([]);
      doSearch(initialQuery, 1);
    }
  }, [initialQuery, doSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setQuery(inputVal);
    setPage(1);
    setResults([]);
    router.push(`/search?q=${encodeURIComponent(inputVal)}`);
    doSearch(inputVal, 1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    doSearch(query, next);
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <div className="browse-header">
          <h1 className="browse-title">Search</h1>
          <p className="browse-subtitle">Find movies and TV shows</p>
        </div>

        <div style={{ padding: '0 48px 32px' }}>
          <form onSubmit={handleSearch} style={{ position: 'relative', maxWidth: 600 }}>
            <span style={{
              position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none'
            }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/>
                <path strokeLinecap="round" d="M21 21l-4.35-4.35"/>
              </svg>
            </span>
            <input
              id="search-page-input"
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Search movies, TV shows..."
              style={{
                width: '100%',
                padding: '14px 56px 14px 50px',
                background: 'rgba(255,255,255,0.06)',
                border: '1.5px solid var(--border)',
                borderRadius: 12,
                color: 'white',
                fontSize: 16,
                outline: 'none',
                fontFamily: 'inherit',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.25)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <button
              type="submit"
              id="search-page-submit"
              style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                padding: '7px 16px',
                background: 'white', color: 'black',
                border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Search
            </button>
          </form>
        </div>

        {loading && results.length === 0 ? (
          <div className="movies-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-poster" style={{ aspectRatio: '2/3' }} />
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-meta" />
              </div>
            ))}
          </div>
        ) : searched && results.length === 0 ? (
          <div className="watchlist-empty">
            <div className="watchlist-empty-icon">🔍</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>No results found</h2>
            <p>Try searching with different keywords</p>
          </div>
        ) : results.length > 0 ? (
          <>
            <div style={{ padding: '0 48px', marginBottom: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
              Results for &quot;<strong style={{ color: 'white' }}>{query}</strong>&quot;
            </div>
            <div className="movies-grid">
              {results.map(item => (
                <MovieCard
                  key={`${item.id}-${item.media_type}`}
                  movie={item}
                  mediaType={item.media_type === 'tv' ? 'tv' : 'movie'}
                />
              ))}
            </div>
            {page < totalPages && (
              <div style={{ textAlign: 'center', padding: '40px 48px' }}>
                <button
                  id="search-load-more"
                  onClick={loadMore}
                  disabled={loading}
                  style={{
                    padding: '12px 32px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    color: 'white',
                    fontSize: 14, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ padding: '60px 48px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
            <p style={{ fontSize: 16 }}>Search for movies and TV shows to watch</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
