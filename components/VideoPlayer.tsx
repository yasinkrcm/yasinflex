'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { type TMDBEpisode } from '@/lib/tmdb';

interface VideoPlayerProps {
  type: 'movie' | 'tv';
  id: number;
  season?: number;
  episode?: number;
  title?: string;
  poster?: string;
  episodes?: TMDBEpisode[];
  onEpisodeChange?: (ep: number) => void;
}

const SOURCES = [
  { id: 'vidsrc',  label: 'Server 1', build: (type: string, id: number, s?: number, e?: number) =>
      type === 'movie' ? `https://vidsrc.me/embed/movie?tmdb=${id}` : `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s??1}&episode=${e??1}` },
  { id: 'vidsrc2', label: 'Server 2', build: (type: string, id: number, s?: number, e?: number) =>
      type === 'movie' ? `https://vidsrc.xyz/embed/movie?tmdb=${id}` : `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s??1}&episode=${e??1}` },
  { id: '2embed',  label: 'Server 3', build: (type: string, id: number, s?: number, e?: number) =>
      type === 'movie' ? `https://www.2embed.cc/embed/${id}` : `https://www.2embed.cc/embedtv/${id}?s=${s??1}&e=${e??1}` },
  { id: 'superembed', label: 'Server 4', build: (type: string, id: number, s?: number, e?: number) =>
      type === 'movie' ? `https://multiembed.mov/?video_id=${id}&tmdb=1` : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s??1}&e=${e??1}` },
];

export default function VideoPlayer({
  type, id, season, episode, title, poster, episodes, onEpisodeChange,
}: VideoPlayerProps) {
  const { user, guestId } = useAuth();
  const [source, setSource]       = useState('vidsrc');
  const [loaded, setLoaded]       = useState(false);
  const [blocked, setBlocked]     = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [quality, setQuality]     = useState('4K Ultra HD');
  const [qualityOpen, setQualityOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const countdownRef  = useRef<NodeJS.Timeout | null>(null);
  const origOpenRef   = useRef<typeof window.open | null>(null);
  const saveTimerRef  = useRef<NodeJS.Timeout | null>(null);

  const currentEpisode = episode ?? 1;
  const currentSeason  = season ?? 1;

  const triggerQualityToast = (q: string) => {
    setToastMessage(`Yayın kalitesi ${q} olarak optimize edildi`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ─── Güvenli Reklam Engelleme (Sadece Zararlı Pop-up'ları Kapatır) ─── */
  useEffect(() => {
    origOpenRef.current = window.open;
    (window as Window).open = function (...args: Parameters<typeof window.open>) {
      const url = typeof args[0] === 'string' ? args[0] : (args[0]?.toString() ?? '');
      // Bilinen yayın platformları haricindeki yönlendirmeleri (reklamları) sessizce iptal et
      if (url && !['vidsrc', '2embed', 'multiembed', 'youtube', 'themoviedb'].some(d => url.toLowerCase().includes(d))) {
        setBlocked(n => n + 1);
        return null;
      }
      return origOpenRef.current!.apply(window, args);
    };

    return () => {
      if (origOpenRef.current) (window as Window).open = origOpenRef.current;
    };
  }, []);

  /* ─── İzleme geçmişini kaydet ──────────────────────────────────── */
  const saveProgress = useCallback(async (progress = 0) => {
    if (!title) return;
    const body = {
      mediaId: id, mediaType: type, title, poster: poster ?? '',
      season: currentSeason, episode: currentEpisode,
      progress, duration: 0,
      ...(user ? {} : { guestId }),
    };
    try {
      await fetch('/api/watch-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {}
  }, [id, type, title, poster, currentSeason, currentEpisode, user, guestId]);

  // Player yüklenince kaydet
  useEffect(() => {
    if (!loaded) return;
    saveProgress(0);
    // 30 saniyede bir kaydet
    saveTimerRef.current = setInterval(() => saveProgress(50), 30000);
    return () => { if (saveTimerRef.current) clearInterval(saveTimerRef.current); };
  }, [loaded, saveProgress]);

  /* ─── Otomatik sonraki bölüm ────────────────────────────────────── */
  const hasNextEpisode = type === 'tv' && episodes && currentEpisode < episodes.length;
  const nextEp = episodes?.find(e => e.episode_number === currentEpisode + 1);

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  };

  const startAutoNext = useCallback(() => {
    if (!hasNextEpisode || !onEpisodeChange) return;
    setCountdown(10);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          onEpisodeChange(currentEpisode + 1);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [hasNextEpisode, onEpisodeChange, currentEpisode]);

  const goNextEpisode = () => {
    cancelCountdown();
    if (onEpisodeChange) onEpisodeChange(currentEpisode + 1);
  };

  // Bölüm değişince countdown'ı iptal et
  useEffect(() => {
    cancelCountdown();
    setLoaded(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episode, season, source]);

  const srcObj = SOURCES.find(s => s.id === source) ?? SOURCES[0];
  const embedURL = srcObj.build(type, id, currentSeason, currentEpisode);

  return (
    <div className="player-section">
      {/* Başlık + Sunucu seçici */}
      <div className="player-header">
        <span className="player-title">
          {title ? `▶ ${title}` : 'Video Player'}
          {type === 'tv' && season && episode &&
            ` — S${String(currentSeason).padStart(2,'0')}E${String(currentEpisode).padStart(2,'0')}`}
        </span>
        
        <div className="player-controls-right">
          {/* Kalite Seçici */}
          <div className="player-quality-container">
            <button
              id="player-quality-btn"
              className="player-quality-btn"
              onClick={() => setQualityOpen(!qualityOpen)}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              {quality}
            </button>
            {qualityOpen && (
              <div className="player-quality-dropdown">
                {['4K Ultra HD', '1080p Full HD', '720p HD'].map(q => (
                  <button
                    key={q}
                    className={`player-quality-item ${quality === q ? 'active' : ''}`}
                    onClick={() => {
                      setQuality(q);
                      setQualityOpen(false);
                      triggerQualityToast(q);
                    }}
                  >
                    <span>{q}</span>
                    {q.includes('4K') && <span className="quality-badge-atmos">Dolby Vision · Atmos</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="player-source-btns">
            {SOURCES.map(s => (
              <button
                key={s.id}
                id={`player-source-${s.id}`}
                className={`player-source-btn ${source === s.id ? 'active' : ''}`}
                onClick={() => setSource(s.id)}
              >{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Video */}
      <div className="player-frame-wrap">
        {toastMessage && (
          <div className="player-toast-overlay">
            <div className="player-toast-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {!loaded && (
          <div className="player-loading">
            <div className="loader-spinner" />
            <span>Yükleniyor...</span>
          </div>
        )}

        {/* Orjinal Oynatıcı Kontrolleri Aktif - Saydam Katman Kaldırıldı */}
        <iframe
          ref={iframeRef}
          key={embedURL}
          src={embedURL}
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share; gyroscope; accelerometer"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          title={title || 'Video Player'}
          style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        />

        {/* Otomatik sonraki bölüm overlay */}
        {countdown !== null && nextEp && (
          <div className="autonext-overlay">
            <div className="autonext-card">
              <span className="autonext-label">Sonraki Bölüm</span>
              <strong className="autonext-title">
                E{String(currentEpisode + 1).padStart(2,'0')} · {nextEp.name}
              </strong>
              <div className="autonext-progress-wrap">
                <div
                  className="autonext-progress-bar"
                  style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                />
              </div>
              <div className="autonext-actions">
                <button className="autonext-btn-play" onClick={goNextEpisode}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Şimdi İzle ({countdown}s)
                </button>
                <button className="autonext-btn-cancel" onClick={cancelCountdown}>
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sonraki bölüm butonu (sayaç değilse) */}
      {type === 'tv' && hasNextEpisode && countdown === null && loaded && (
        <div className="player-autonext-bar">
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Sonraki: E{String(currentEpisode + 1).padStart(2,'0')}{nextEp ? ` · ${nextEp.name}` : ''}
          </span>
          <button className="player-next-btn" onClick={startAutoNext}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Sonraki Bölüm →
          </button>
        </div>
      )}

      {/* Durum çubuğu */}
      <div className="player-status-bar">
        <span className="player-status-item">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Reklam koruması aktif
        </span>
        <span className="player-status-sep" />
        <span className="player-badge badge-4k">4K UHD</span>
        <span className="player-badge badge-vision">Dolby Vision</span>
        <span className="player-badge badge-atmos">Dolby Atmos</span>
        <span className="player-badge badge-hdr">HDR</span>
        {blocked > 0 && (
          <span className="player-status-item" style={{ color: '#fb923c' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
            </svg>
            {blocked} engellendi
          </span>
        )}
        <span className="player-status-tip">Açılmıyorsa farklı sunucu dene →</span>
      </div>
    </div>
  );
}
