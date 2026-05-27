'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { type TMDBMovie, proxyImg, getDisplayTitle, getYear } from '@/lib/tmdb';

interface MovieCardProps {
  movie: TMDBMovie;
  mediaType?: 'movie' | 'tv';
}

export function MovieCard({ movie, mediaType }: MovieCardProps) {
  const type = mediaType || (movie.media_type === 'tv' ? 'tv' : 'movie');
  const title = getDisplayTitle(movie);
  const year = getYear(movie);

  return (
    <Link
      href={`/${type}/${movie.id}`}
      id={`card-${type}-${movie.id}`}
      className="movie-card"
      title={title}
    >
      <div className="movie-card-poster">
        {movie.poster_path ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={proxyImg(movie.poster_path, 'w342')} alt={title} loading="lazy" />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13,
            background: 'var(--bg-secondary)', padding: 12, textAlign: 'center'
          }}>
            {title}
          </div>
        )}
        <div className="movie-card-overlay">
          <div className="movie-card-play">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          {movie.vote_average > 0 && (
            <div className="movie-card-rating">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {movie.vote_average.toFixed(1)}
            </div>
          )}
        </div>
      </div>
      <div className="movie-card-info">
        <div className="movie-card-title">{title}</div>
        <div className="movie-card-meta">
          <span className={`movie-card-type-badge ${type === 'tv' ? 'badge-tv' : 'badge-movie'}`}>
            {type === 'tv' ? 'TV' : 'Movie'}
          </span>
          {year && <span>{year}</span>}
        </div>
      </div>
    </Link>
  );
}

interface MovieRowProps {
  title: string;
  movies: TMDBMovie[];
  mediaType?: 'movie' | 'tv';
  viewAllHref?: string;
  loading?: boolean;
}

export function MovieRow({ title, movies, mediaType, viewAllHref, loading }: MovieRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  return (
    <div className="section">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {viewAllHref && (
          <Link href={viewAllHref} className="section-view-all">
            View All
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </Link>
        )}
      </div>
      <div className="row-wrap">
        <button className="row-btn row-btn-left" onClick={() => scroll('left')} aria-label="Scroll left">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="row-scroll" ref={scrollRef}>
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton skeleton-poster" />
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-meta" />
                </div>
              ))
            : movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} mediaType={mediaType} />
              ))}
        </div>
        <button className="row-btn row-btn-right" onClick={() => scroll('right')} aria-label="Scroll right">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
