'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import { type TMDBMovie } from '@/lib/tmdb';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<TMDBMovie[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setWatchlist(saved);
    setLoaded(true);
  }, []);

  const clearAll = () => {
    localStorage.removeItem('watchlist');
    setWatchlist([]);
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <div className="browse-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="browse-title">My Watchlist</h1>
            <p className="browse-subtitle">{watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'} saved</p>
          </div>
          {watchlist.length > 0 && (
            <button
              id="clear-watchlist"
              onClick={clearAll}
              style={{
                padding: '8px 16px',
                background: 'rgba(229,9,20,0.1)',
                border: '1px solid rgba(229,9,20,0.3)',
                borderRadius: 8,
                color: '#ff6b6b',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                marginBottom: 8,
              }}
            >
              Clear All
            </button>
          )}
        </div>

        {!loaded ? (
          <div className="movies-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-poster" style={{ aspectRatio: '2/3' }} />
                <div className="skeleton skeleton-title" />
              </div>
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          <div className="watchlist-empty">
            <div className="watchlist-empty-icon">🎬</div>
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Your watchlist is empty</h2>
            <p style={{ marginBottom: 24 }}>Save movies and TV shows to watch later</p>
            <Link
              href="/"
              style={{
                padding: '12px 28px',
                background: 'white',
                color: 'black',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Browse Content
            </Link>
          </div>
        ) : (
          <div className="movies-grid">
            {watchlist.map(item => (
              <MovieCard
                key={`${item.id}-${item.media_type}`}
                movie={item}
                mediaType={item.media_type === 'tv' ? 'tv' : 'movie'}
              />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
