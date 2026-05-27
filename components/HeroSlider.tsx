'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { type TMDBMovie, proxyImg, getDisplayTitle, GENRE_MAP } from '@/lib/tmdb';

interface HeroSliderProps {
  movies: TMDBMovie[];
}

export default function HeroSlider({ movies }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 700);
  };

  const next = () => goTo((current + 1) % movies.length);
  const prev = () => goTo((current - 1 + movies.length) % movies.length);

  useEffect(() => {
    timerRef.current = setInterval(next, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  if (!movies.length) return null;

  const movie = movies[current];
  if (!movie) return null;
  const type = (movie.media_type === 'tv' || movie.name) ? 'tv' : 'movie';

  return (
    <div className="hero">
      {movies.map((m, i) => (
        <div key={m.id} className={`hero-slide ${i === current ? 'active' : ''}`}>
          {m.backdrop_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`https://wsrv.nl/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/original${m.backdrop_path}`)}&output=webp&q=80&n=-1`}
              alt={getDisplayTitle(m)}
              className="hero-bg"
            />
          )}
          <div className="hero-gradient" />
        </div>
      ))}

      <div className="hero-content slide-up">
        <div className="hero-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" />
          </svg>
          {type === 'tv' ? 'TV Show' : 'Movie'}
        </div>

        <h1 className="hero-title">{getDisplayTitle(movie)}</h1>

        <div className="hero-meta">
          {movie.vote_average > 0 && (
            <span className="hero-rating">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              {movie.vote_average.toFixed(1)}
            </span>
          )}
          {(movie.release_date || movie.first_air_date) && (
            <>
              <span className="hero-sep" style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(160,160,160,0.5)', display: 'inline-block' }} />
              <span>{new Date(movie.release_date || movie.first_air_date || '').getFullYear()}</span>
            </>
          )}
        </div>

        {movie.genre_ids && movie.genre_ids.length > 0 && (
          <div className="hero-genres">
            {movie.genre_ids.slice(0, 3).map(id => (
              <span key={id} className="hero-genre-tag">{GENRE_MAP[id] || ''}</span>
            ))}
          </div>
        )}

        {movie.overview && (
          <p className="hero-overview">{movie.overview}</p>
        )}

        <div className="hero-buttons">
          <Link href={`/${type}/${movie.id}`} id={`hero-watch-${movie.id}`} className="btn-watch">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Watch Now
          </Link>
          <Link href={`/${type}/${movie.id}`} id={`hero-info-${movie.id}`} className="btn-info">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10"/>
              <path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
            </svg>
            More Info
          </Link>
        </div>
      </div>

      <div className="hero-indicators">
        {movies.map((_, i) => (
          <button
            key={i}
            className={`hero-dot ${i === current ? 'active' : ''}`}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="hero-arrows">
        <button className="hero-arrow" onClick={prev} aria-label="Previous">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <button className="hero-arrow" onClick={next} aria-label="Next">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
