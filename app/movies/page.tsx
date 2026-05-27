'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { MovieCard } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import {
  getPopularMovies,
  getNowPlaying,
  getTopRatedMovies,
  getUpcomingMovies,
  discoverMovies,
  getMovieGenres,
  type TMDBMovie,
} from '@/lib/tmdb';

const FILTERS = [
  { id: 'popular', label: 'Popular' },
  { id: 'now_playing', label: 'Now Playing' },
  { id: 'top_rated', label: 'Top Rated' },
  { id: 'upcoming', label: 'Upcoming' },
];

import { Suspense } from 'react';

function MoviesPageContent() {
  const searchParams = useSearchParams();
  const genreParam = searchParams.get('genre');

  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('popular');
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(genreParam ? Number(genreParam) : null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    getMovieGenres().then(d => setGenres(d.genres)).catch(() => {});
  }, []);

  const fetchMovies = useCallback(async (f: string, p: number, genre: number | null) => {
    setLoading(true);
    try {
      let data;
      if (genre) {
        data = await discoverMovies({ with_genres: String(genre), sort_by: 'popularity.desc', page: String(p) });
      } else {
        switch (f) {
          case 'now_playing': data = await getNowPlaying(p); break;
          case 'top_rated': data = await getTopRatedMovies(p); break;
          case 'upcoming': data = await getUpcomingMovies(p); break;
          default: data = await getPopularMovies(p); break;
        }
      }
      setMovies(prev => p === 1 ? data.results : [...prev, ...data.results]);
      setTotalPages(data.total_pages);
    } catch {}
    setLoading(false);
    setInitialLoad(false);
  }, []);

  useEffect(() => {
    setPage(1);
    setMovies([]);
    fetchMovies(filter, 1, selectedGenre);
  }, [filter, selectedGenre, fetchMovies]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMovies(filter, nextPage, selectedGenre);
  };

  const handleFilterChange = (f: string) => {
    setFilter(f);
    setSelectedGenre(null);
  };

  const handleGenreChange = (gid: number | null) => {
    setSelectedGenre(gid);
    setFilter('popular');
  };

  return (
    <>
      <Navbar />
      <main className="page-container">
        <div className="browse-header">
          <h1 className="browse-title">Movies</h1>
          <p className="browse-subtitle">Discover and watch your favorite movies</p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          {FILTERS.map(f => (
            <button
              key={f.id}
              id={`filter-${f.id}`}
              className={`filter-chip ${filter === f.id && !selectedGenre ? 'active' : ''}`}
              onClick={() => handleFilterChange(f.id)}
            >
              {f.label}
            </button>
          ))}

          <div style={{ width: 1, height: 32, background: 'var(--border)', margin: '0 4px', alignSelf: 'center' }} />

          {genres.slice(0, 12).map(g => (
            <button
              key={g.id}
              id={`genre-${g.id}`}
              className={`filter-chip ${selectedGenre === g.id ? 'active' : ''}`}
              onClick={() => handleGenreChange(selectedGenre === g.id ? null : g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Grid */}
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
            {movies.map(m => (
              <MovieCard key={`${m.id}-${m.title}`} movie={m} mediaType="movie" />
            ))}
          </div>
        )}

        {/* Load More */}
        {page < totalPages && !initialLoad && (
          <div style={{ textAlign: 'center', padding: '40px 48px' }}>
            <button
              id="load-more-movies"
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

export default function MoviesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MoviesPageContent />
    </Suspense>
  );
}
