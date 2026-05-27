'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import VideoPlayer from '@/components/VideoPlayer';
import EpisodeSelector from '@/components/EpisodeSelector';
import { MovieRow } from '@/components/MovieCard';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import {
  getTVDetails,
  getTVCredits,
  getSimilarTV,
  getTVRecommendations,
  getTVVideos,
  getTVSeasonDetails,
  proxyImg,
  type TMDBMovie,
  type TMDBCast,
  type TMDBSeason,
  type TMDBEpisode,
} from '@/lib/tmdb';

export default function TVDetailClient({ id }: { id: string }) {
  const { user, guestId, loading: authLoading } = useAuth();
  const [show, setShow] = useState<TMDBMovie | null>(null);
  const [cast, setCast] = useState<TMDBCast[]>([]);
  const [similar, setSimilar] = useState<TMDBMovie[]>([]);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<TMDBSeason[]>([]);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [historyProgress, setHistoryProgress] = useState<number | null>(null);
  const [historySeason, setHistorySeason] = useState<number | null>(null);
  const [historyEpisode, setHistoryEpisode] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('watchlist') || '[]');
    setInWatchlist(saved.some((m: TMDBMovie) => String(m.id) === id));
  }, [id]);

  useEffect(() => {
    if (authLoading) return;
    setLoading(true);
    
    const searchParams = new URLSearchParams(window.location.search);
    const shouldResume = searchParams.get('resume') === 'true';

    const historyUrl = user 
      ? `/api/watch-history?mediaId=${id}&mediaType=tv` 
      : guestId 
      ? `/api/watch-history?mediaId=${id}&mediaType=tv&guestId=${guestId}`
      : null;

    Promise.all([
      getTVDetails(id),
      getTVCredits(id),
      getSimilarTV(id),
      getTVRecommendations(id),
      getTVVideos(id),
      historyUrl ? fetch(historyUrl).then(r => r.json()).catch(() => ({ history: [] })) : Promise.resolve({ history: [] })
    ]).then(([s, credits, sim, recs, vids, histData]) => {
      setShow(s);
      setCast(credits.cast.slice(0, 12));
      const combined = [...recs.results, ...sim.results];
      const unique = Array.from(new Map(combined.map(x => [x.id, x])).values());
      setSimilar(unique.slice(0, 20));
      const trailer = vids.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
      setTrailerKey(trailer?.key || null);

      // Filter valid seasons
      const validSeasons = (s as TMDBMovie & { seasons?: TMDBSeason[] }).seasons?.filter(
        (season: TMDBSeason) => season.season_number > 0 && season.episode_count > 0
      ) || [];
      setSeasons(validSeasons);
      setLoading(false);

      const firstSeason = validSeasons[0]?.season_number || 1;
      let targetSeason = firstSeason;
      let targetEpisode = 1;

      if (histData.history && histData.history.length > 0) {
        const hist = histData.history[0];
        setHistoryProgress(hist.progress);
        setHistorySeason(hist.season);
        setHistoryEpisode(hist.episode);

        if (shouldResume || hist.progress > 5) {
          targetSeason = hist.season ?? firstSeason;
          targetEpisode = hist.episode ?? 1;
          if (shouldResume) {
            setShowPlayer(true);
          }
        }
      } else if (shouldResume) {
        setShowPlayer(true);
      }

      setCurrentSeason(targetSeason);
      setCurrentEpisode(targetEpisode);
      return getTVSeasonDetails(id, targetSeason);
    }).then((seasonData) => {
      if (seasonData) setEpisodes(seasonData.episodes || []);
    }).catch(() => setLoading(false));
  }, [id, user, guestId, authLoading]);

  const handleSeasonChange = async (season: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(1);
    setShowPlayer(false);
    try {
      const data = await getTVSeasonDetails(id, season);
      setEpisodes(data.episodes || []);
    } catch {}
  };

  const handleEpisodeSelect = (episode: number) => {
    setCurrentEpisode(episode);
    setShowPlayer(true);
    setTimeout(() => {
      document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const toggleWatchlist = () => {
    if (!show) return;
    const saved: TMDBMovie[] = JSON.parse(localStorage.getItem('watchlist') || '[]');
    let updated;
    if (inWatchlist) {
      updated = saved.filter(m => String(m.id) !== id);
    } else {
      updated = [{ ...show, media_type: 'tv' }, ...saved];
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

  if (!show) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '120px 48px', color: 'var(--text-secondary)' }}>
          <h1>Show not found</h1>
          <Link href="/" style={{ color: 'white', marginTop: 16, display: 'inline-block' }}>← Back to Home</Link>
        </div>
      </>
    );
  }

  const title = show.name || show.title || '';
  const year = (show.first_air_date || '').slice(0, 4);

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
            {show.backdrop_path && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://wsrv.nl/?url=${encodeURIComponent(`https://image.tmdb.org/t/p/original${show.backdrop_path}`)}&output=webp&q=75&n=-1`}
                alt={title}
              />
            )}
            <div className="detail-backdrop-gradient" />
          </div>

          <div className="detail-content">
            {show.poster_path && (
              <div className="detail-poster">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proxyImg(show.poster_path, 'w500')} alt={title} />
              </div>
            )}

            <div className="detail-info slide-up">
              <div className="detail-badge" style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                TV Show
              </div>

              <h1 className="detail-title">{title}</h1>
              {show.tagline && <p className="detail-tagline">&quot;{show.tagline}&quot;</p>}

              <div className="detail-meta-row">
                {show.vote_average > 0 && (
                  <span className="detail-rating">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    {show.vote_average.toFixed(1)}
                  </span>
                )}
                {year && <><span className="detail-sep"/><span>{year}</span></>}
                {show.number_of_seasons && (
                  <><span className="detail-sep"/><span>{show.number_of_seasons} Seasons</span></>
                )}
                {show.number_of_episodes && (
                  <><span className="detail-sep"/><span>{show.number_of_episodes} Episodes</span></>
                )}
                {show.status && <><span className="detail-sep"/><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{show.status}</span></>}
                <span className="detail-sep"/>
                <span className="premium-badge badge-4k">4K UHD</span>
                <span className="premium-badge badge-vision">Dolby Vision</span>
                <span className="premium-badge badge-atmos">Dolby Atmos</span>
                <span className="premium-badge badge-hdr">HDR</span>
              </div>

              {show.genres && show.genres.length > 0 && (
                <div className="detail-genres">
                  {show.genres.map(g => (
                    <Link key={g.id} href={`/tv?genre=${g.id}`} className="detail-genre-tag">{g.name}</Link>
                  ))}
                </div>
              )}

              {show.overview && <p className="detail-overview">{show.overview}</p>}

              <div className="detail-actions">
                {historyProgress && historyProgress > 5 && historySeason && historyEpisode ? (
                  <button
                    id="btn-resume-tv"
                    className="btn-play"
                    onClick={() => {
                      setShowPlayer(true);
                      setTimeout(() => {
                        document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Kaldığın Yerden Devam Et (S{String(historySeason).padStart(2, '0')}E{String(historyEpisode).padStart(2, '0')})
                  </button>
                ) : (
                  <button
                    id="btn-play-tv"
                    className="btn-play"
                    onClick={() => {
                      setShowPlayer(true);
                      setTimeout(() => {
                        document.querySelector('.player-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Watch Now
                  </button>
                )}
                <button
                  id="btn-watchlist-tv"
                  className={`btn-watchlist ${inWatchlist ? 'in-watchlist' : ''}`}
                  onClick={toggleWatchlist}
                >
                  <svg width="16" height="16" fill={inWatchlist ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                  </svg>
                  {inWatchlist ? 'Saved' : 'Add to Watchlist'}
                </button>
                {trailerKey && (
                  <button id="btn-trailer-tv" className="btn-trailer" onClick={() => setShowTrailer(true)}>
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
          <VideoPlayer
            type="tv"
            id={show.id}
            season={currentSeason}
            episode={currentEpisode}
            title={title}
            poster={show.poster_path ?? undefined}
            episodes={episodes}
            onEpisodeChange={handleEpisodeSelect}
          />
        )}

        {/* Episode Selector */}
        {seasons.length > 0 && (
          <EpisodeSelector
            seasons={seasons}
            episodes={episodes}
            currentSeason={currentSeason}
            currentEpisode={currentEpisode}
            onSeasonChange={handleSeasonChange}
            onEpisodeSelect={handleEpisodeSelect}
          />
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

        {/* Similar */}
        {similar.length > 0 && (
          <MovieRow title="More Like This" movies={similar} mediaType="tv" />
        )}
      </main>
      <Footer />
    </>
  );
}
