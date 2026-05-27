'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import { MovieRow } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMovieDetails,
  getMovieCredits,
  getSimilarMovies,
  getMovieRecommendations,
  getMovieVideos,
  proxyImg,
  type TMDBMovie,
  type TMDBCast,
} from '@/lib/tmdb';

export default function MovieDetailClient({ id }: { id: string }) {
  const { user, guestId, loading: authLoading } = useAuth();
  const [movie, setMovie] = useState<TMDBMovie | null>(null);
  const [cast, setCast] = useState<TMDBCast[]>([]);
  const [similar, setSimilar] = useState<TMDBMovie[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [historyProgress, setHistoryProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setInWatchlist(saved.some((m: TMDBMovie) => String(m.id) === id));
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    
    // Check if ?resume=true is present in URL
    const searchParams = new URLSearchParams(window.location.search);
    const shouldResume = searchParams.get('resume') === 'true';

    const historyUrl = user 
      ? `/api/watch-history?mediaId=${id}&mediaType=movie` 
      : guestId 
      ? `/api/watch-history?mediaId=${id}&mediaType=movie&guestId=${guestId}`
      : null;

    Promise.all([
      getMovieDetails(id),
      getMovieCredits(id),
      getSimilarMovies(id),
      getMovieRecommendations(id),
      getMovieVideos(id),
      historyUrl ? fetch(historyUrl).then(r => r.json()).catch(() => ({ history: [] })) : Promise.resolve({ history: [] })
    ]).then(([m, credits, sim, recs, vids, histData]) => {
      setMovie(m);
      setCast(credits.cast.slice(0, 12));
      const combined = [...recs.results, ...sim.results];
      const unique = Array.from(new Map(combined.map(x => [x.id, x])).values());
      setSimilar(unique.slice(0, 20));
      const trailer = vids.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      setTrailerKey(trailer?.key || null);

      if (histData.history && histData.history.length > 0) {
        const prog = histData.history[0].progress;
        setHistoryProgress(prog);
        if (shouldResume) {
          setShowPlayer(true);
        }
      } else if (shouldResume) {
        setShowPlayer(true);
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id, user, guestId, authLoading]);

  const toggleWatchlist = () => {
    if (!movie) return;
    const saved: TMDBMovie[] = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let updated;
    if (inWatchlist) {
      updated = saved.filter(m => String(m.id) !== id);
    } else {
      updated = [{ ...movie, media_type: 'movie' }, ...saved];
    }
    localStorage.setItem('watchlist', JSON.stringify(updated));
    setInWatchlist(!inWatchlist);
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div className="loader-spinner" />
        </div>
      </>
    );
  }

  if (!movie) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '120px 48px', color: 'var(--text-secondary)' }}>
          <h1>Movie not found</h1>
          <Link href="/" style={{ color: 'white', marginTop: 16, display: 'inline-block' }}>← Back to Home</Link>
        </div>
      </>
    );
  }

  const title = movie.title || movie.name || '';
  const year = (movie.release_date || '').slice(0, 4);
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const mins = movie.runtime ? movie.runtime % 60 : 0;
  const runtime = movie.runtime ? `${hours}h ${mins}m` : '';

  return (
    <>
      <Navbar />

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.92)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowTrailer(false)}
        >
          <div style={{ width: '90%', maxWidth: 900, aspectRatio: '16/9', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              allowFullScreen
              allow="autoplay"
              style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12 }}
              title="Trailer"
            />
            <button
              onClick={() => setShowTrailer(false)}
              style={{
                position: 'absolute', top: -40, right: 0,
                background: 'none', border: 'none', color: 'white',
                fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Close
            </button>
          </div>
        </div>
      )}

      <main className="page-container">
        {/* Hero */}
        <div className="detail-hero">
          <div className="detail-backdrop">
            {movie.backdrop_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://wsrv.nl/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`)}&output=webp&q=75&n=-1`}
                alt={title}
              />
            )}
            <div className="detail-backdrop-gradient" />
          </div>

          <div className="detail-content">
            {movie.poster_path && (
              <div className="detail-poster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proxyImg(movie.poster_path, 'w500')} alt={title} />
              </div>
            )}

            <div className="detail-info slide-up">
              <div className="detail-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                Movie
              </div>

              <h1 className="detail-title">{title}</h1>
              {movie.tagline && <p className="detail-tagline">&quot;{movie.tagline}&quot;</p>}

              <div className="detail-meta-row">
                {movie.vote_average > 0 && (
                  <span className="detail-rating">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
                {year && <><span className="detail-sep"/><span>{year}</span></>}
                {runtime && <><span className="detail-sep"/><span>{runtime}</span></>}
                {movie.status && <><span className="detail-sep"/><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{movie.status}</span></>}
                <span className="detail-sep"/>
                <span className="premium-badge badge-4k">4K UHD</span>
                <span className="premium-badge badge-vision">Dolby Vision</span>
                <span className="premium-badge badge-atmos">Dolby Atmos</span>
                <span className="premium-badge badge-hdr">HDR</span>
              </div>

              {movie.genres && movie.genres.length > 0 && (
                <div className="detail-genres">
                  {movie.genres.map(g => (
                    <Link key={g.id} href={`/movies?genre=${g.id}`} className="detail-genre-tag">{g.name}</Link>
                  ))}
                </div>
              )}

              {movie.overview && <p className="detail-overview">{movie.overview}</p>}

              <div className="detail-actions">
                {historyProgress && historyProgress > 5 ? (
                  <button id="btn-resume-movie" className="btn-play" onClick={() => setShowPlayer(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Kaldığın Yerden Devam Et (%{Math.round(historyProgress)})
                  </button>
                ) : (
                  <button id="btn-play-movie" className="btn-play" onClick={() => setShowPlayer(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Watch Now
                  </button>
                )}
                <button
                  id="btn-watchlist-movie"
                  className={`btn-watchlist ${inWatchlist ? 'in-watchlist' : ''}`}
                  onClick={toggleWatchlist}
                >
                  <svg width="16" height="16" fill={inWatchlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                  {inWatchlist ? 'Saved' : 'Add to Watchlist'}
                </button>
                {trailerKey && (
                  <button id="btn-trailer-movie" className="btn-trailer" onClick={() => setShowTrailer(true)}>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <polygon points="5 3 19 12 5 21 5 3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player */}
        {showPlayer && (
          <VideoPlayer type="movie" id={movie.id} title={title} />
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <div className="cast-section">
            <h3 className="section-title" style={{ marginBottom: 16 }}>Cast</h3>
            <div className="cast-grid">
              {cast.map(person => (
                <div key={person.id} className="cast-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.profile_path
                      ? proxyImg(person.profile_path, 'w185')
                      : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="%23333"%3E%3Ccircle cx="12" cy="8" r="4"/%3E%3Cpath d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/%3E%3C/svg%3E'
                    }
                    alt={person.name}
                    className="cast-photo"
                  />
                  <div className="cast-name">{person.name}</div>
                  <div className="cast-character">{person.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar / Recommendations */}
        {similar.length > 0 && (
          <MovieRow title="More Like This" movies={similar} mediaType="movie" />
        )}
      </main>
      <Footer />
    </>
  );
}
