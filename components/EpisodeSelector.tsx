'use client';

import { useState } from 'react';
import { type TMDBSeason, type TMDBEpisode, proxyImg } from '@/lib/tmdb';

interface EpisodeSelectorProps {
  seasons: TMDBSeason[];
  episodes: TMDBEpisode[];
  currentSeason: number;
  currentEpisode: number;
  onSeasonChange: (season: number) => void;
  onEpisodeSelect: (episode: number) => void;
}

export default function EpisodeSelector({
  seasons,
  episodes,
  currentSeason,
  currentEpisode,
  onSeasonChange,
  onEpisodeSelect,
}: EpisodeSelectorProps) {
  return (
    <div className="episode-section">
      <div className="episode-section-header">
        <h3 className="section-title">Episodes</h3>
        <select
          id="season-select"
          className="season-select"
          value={currentSeason}
          onChange={(e) => onSeasonChange(Number(e.target.value))}
        >
          {seasons
            .filter(s => s.season_number > 0)
            .map(s => (
              <option key={s.id} value={s.season_number}>
                Season {s.season_number} ({s.episode_count} episodes)
              </option>
            ))}
        </select>
      </div>
      <div className="episodes-grid">
        {episodes.map((ep) => (
          <div
            key={ep.id}
            id={`episode-${ep.episode_number}`}
            className={`episode-card ${ep.episode_number === currentEpisode ? 'playing' : ''}`}
            onClick={() => onEpisodeSelect(ep.episode_number)}
          >
            {ep.still_path ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxyImg(ep.still_path, 'w300')}
                alt={ep.name}
                className="episode-thumb"
              />
            ) : (
              <div className="episode-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            )}
            <div className="episode-info">
              <div className="episode-num">Episode {ep.episode_number}</div>
              <div className="episode-name">{ep.name}</div>
              {ep.runtime && <div className="episode-runtime">{ep.runtime} min</div>}
            </div>
            {ep.episode_number === currentEpisode && (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)', flexShrink: 0 }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
