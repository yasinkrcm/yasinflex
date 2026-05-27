'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import {
  getPopularTV,
  getAiringToday,
  getTVGenres,
  discoverTV,
  type TMDBMovie,
} from '@/lib/tmdb';

const FILTERS = [
  { id: 'popular', label: 'Popular' },
  { id: 'airing_today', label: 'Airing Today' },
  { id: 'top_rated', label: 'Top Rated' },
];

export default function TVPage() {
  const searchParams = useSearchParams();
  const genreParam = searchParams.get('genre');

  const [shows, setShows] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('popular');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(genreParam ? Number(genreParam) : null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    getTVGenres().then(d => setGenres(d.genres)).catch(() => {});
  }, []);

  const fetchShows = useCallback(async (f: string, p: number, genre: number | null) => {
    setLoading(true);
    try {
      let data;
      if (genre) {
        data = await discoverTV({ with_genres: String(genre), sort_by: 'popularity.desc', page: String(p) });
      } else {
        switch (f) {
          case 'airing_today': data = await getAiringToday(p); break;
          case 'top_rated': data = await discoverTV({ sort_by: 'vote_average.desc', 'vote_count.gte': '200', page: String(p) }); break;
          default: data = await getPopularTV(p); break;
        }
      }
      setShows(prev => p === 1 ? data.results : [...prev, ...data.results]);
      setTotalPages(data.total_pages);
    } catch {}
    setLoading(false);
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    setPage(1);
    setShows([]);
    fetchShows(filter, 1, selectedGenre);
  }, [filter, selectedGenre, fetchShows]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchShows(filter, nextPage, selectedGenre);
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <div className="browse-header">
          <h1 className="browse-title">TV Shows</h1>
          <p className="browse-subtitle">Stream your favorite TV series and episodes</p>
        </div>

        <div className="filter-bar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              id={`tv-filter-${f.id}`}
              className={`filter-chip ${filter === f.id && !selectedGenre ? 'active' : ''}`}
              onClick={() => { setFilter(f.id); setSelectedGenre(null); }}
            >
              {f.label}
            </button>
          ))}

          <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px', alignSelf: 'center' }} />

          {genres.slice(0, 12).map(g => (
            <button
              key={g.id}
              id={`tv-genre-${g.id}`}
              className={`filter-chip ${selectedGenre === g.id ? 'active' : ''}`}
              onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>

        {initialLoad ? (
          <div className="movies-grid">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton skeleton-poster" style={{ aspectRatio: '2/3' }} />
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-meta" />
              </div>
            ))}
          </div>
        ) : (
          <div className="movies-grid">
            {shows.map(s => (
              <MovieCard key={`${s.id}-${s.name}`} movie={s} mediaType="tv" />
            ))}
          </div>
        )}

        {page < totalPages && !initialLoad && (
          <div style={{ textAlign: 'center', padding: '40px 48px' }}>
            <button
              id="load-more-tv"
              onClick={loadMore}
              disabled={loading}
              style={{
                padding: '12px 32px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
