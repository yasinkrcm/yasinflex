'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { proxyImg } from '@/lib/tmdb';

interface HistoryItem {
  _id: string;
  mediaId: number;
  mediaType: 'movie' | 'tv';
  title: string;
  poster: string;
  season?: number;
  episode?: number;
  progress: number;
  updatedAt: string;
}

export default function ContinueWatchingRow() {
  const { user, guestId, loading } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const rowRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    if (loading) return;
    try {
      const url = user
        ? '/api/watch-history'
        : guestId
        ? `/api/watch-history?guestId=${guestId}`
        : null;

      if (!url) {
        setFetching(false);
        return;
      }

      const r = await fetch(url);
      const d = await r.json();
      if (d.history) {
        // filter out invalid item properties
        setHistory(d.history.filter((item: HistoryItem) => item.mediaId));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user, guestId, loading]);

  const removeHistory = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const guestParam = user ? '' : `&guestId=${encodeURIComponent(guestId)}`;
      const r = await fetch(`/api/watch-history?id=${id}${guestParam}`, { method: 'DELETE' });
      if (r.ok) {
        setHistory(prev => prev.filter(item => item._id !== id));
      }
    } catch {}
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const offset = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' });
    }
  };

  if (fetching || history.length === 0) return null;

  return (
    <div className="movie-row-container continue-watching-section fade-in">
      <div className="movie-row-header">
        <h2 className="movie-row-title">İzlemeye Devam Et</h2>
      </div>

      <div className="movie-row-wrapper">
        <button className="row-arrow left" onClick={() => scroll('left')} aria-label="Sola kaydır">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="movie-row-items" ref={rowRef}>
          {history.map((item) => {
            const resumeUrl = item.mediaType === 'tv'
              ? `/tv/${item.mediaId}?resume=true`
              : `/movie/${item.mediaId}?resume=true`;

            return (
              <Link href={resumeUrl} key={item._id} className="continue-watching-card group">
                <div className="continue-watching-media">
                  {item.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={proxyImg(item.poster, 'w342')}
                      alt={item.title}
                      className="continue-watching-img"
                    />
                  ) : (
                    <div className="continue-watching-placeholder" />
                  )}
                  
                  {/* Play Overlay */}
                  <div className="continue-card-overlay">
                    <div className="continue-play-btn">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    className="continue-remove-btn"
                    onClick={(e) => removeHistory(e, item._id)}
                    title="Geçmişten Kaldır"
                  >
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* TV badge overlay */}
                  {item.mediaType === 'tv' && item.season && item.episode && (
                    <div className="continue-tv-badge">
                      S{item.season} · E{item.episode}
                    </div>
                  )}
                </div>

                <div className="continue-watching-info">
                  <div className="continue-watching-title">{item.title}</div>
                  <div className="continue-watching-meta">
                    {item.mediaType === 'tv' ? 'Dizi' : 'Film'}
                  </div>
                  {/* Progress bar */}
                  <div className="continue-progress-wrap">
                    <div
                      className="continue-progress-bar"
                      style={{ width: `${Math.min(100, Math.max(5, item.progress))}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <button className="row-arrow right" onClick={() => scroll('right')} aria-label="Sağa kaydır">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
