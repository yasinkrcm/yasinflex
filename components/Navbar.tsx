'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { searchMulti, proxyImg, getDisplayTitle, getYear, type TMDBMovie } from '@/lib/tmdb';
import { useAuth } from '@/contexts/AuthContext';

export default function Navbar() {
  const { user, loading: authLoading, openAuth, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TMDBMovie[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [searchOpen]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await searchMulti(q);
      setResults(data.results.filter(r => r.media_type !== 'person').slice(0, 8));
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const goToItem = (item: TMDBMovie) => {
    const type = item.media_type === 'tv' ? 'tv' : 'movie';
    router.push(`/${type}/${item.id}`);
    setSearchOpen(false);
  };

  const isActive = (path: string) => pathname === path ? 'active' : '';

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            Yasin<span>flex</span>
          </Link>

          <div className="navbar-links">
            <Link href="/" className={isActive('/')}>Home</Link>
            <Link href="/movies" className={isActive('/movies')}>Movies</Link>
            <Link href="/tv" className={isActive('/tv')}>TV Shows</Link>
            <Link href="/search" className={isActive('/search')}>Browse</Link>
          </div>

          <div className="navbar-right">
            <button
              id="nav-search-btn"
              className="navbar-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <Link href="/watchlist" id="nav-watchlist-btn" className="navbar-watchlist-btn">
              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Watchlist
            </Link>

            {authLoading ? (
              <span className="navbar-auth-loading" />
            ) : user ? (
              <div className="navbar-user-dropdown">
                <button className="navbar-profile-btn" id="nav-profile-btn">
                  <div className="navbar-profile-avatar">
                    {user.username[0].toUpperCase()}
                  </div>
                  <span className="navbar-profile-name">{user.username}</span>
                </button>
                <div className="navbar-dropdown-content">
                  <div className="dropdown-user-info">
                    <strong>{user.username}</strong>
                    <span>{user.email}</span>
                  </div>
                  <hr />
                  <Link href="/watchlist">Listem</Link>
                  <button onClick={logout} className="dropdown-logout-btn">Çıkış Yap</button>
                </div>
              </div>
            ) : (
              <button
                id="nav-signin-btn"
                className="navbar-signin-btn"
                onClick={() => openAuth('login')}
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </nav>

      {searchOpen && (
        <div className="search-overlay fade-in" onClick={(e) => {
          if (e.target === e.currentTarget) setSearchOpen(false);
        }}>
          <div className="search-box">
            <div className="search-input-wrap">
              <span className="search-icon-left">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                </svg>
              </span>
              <input
                ref={inputRef}
                className="search-input"
                placeholder="Search movies, TV shows..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchOpen(false);
                  if (e.key === 'Enter' && query.trim()) {
                    router.push(`/search?q=${encodeURIComponent(query)}`);
                    setSearchOpen(false);
                  }
                }}
              />
              <button className="search-close-btn" onClick={() => setSearchOpen(false)}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {(results.length > 0 || loading || (query && !loading)) && (
              <div className="search-results">
                {loading ? (
                  <div className="search-no-results">Searching...</div>
                ) : results.length === 0 ? (
                  <div className="search-no-results">No results found for &quot;{query}&quot;</div>
                ) : (
                  results.map((item) => (
                    <div
                      key={item.id}
                      className="search-result-item"
                      onClick={() => goToItem(item)}
                    >
                      {item.poster_path ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proxyImg(item.poster_path, 'w92')}
                          alt={getDisplayTitle(item)}
                          className="search-result-poster"
                        />
                      ) : (
                        <div className="search-result-poster" style={{ background: 'var(--bg-secondary)' }} />
                      )}
                      <div className="search-result-info">
                        <div className="search-result-title">{getDisplayTitle(item)}</div>
                        <div className="search-result-meta">
                          {item.media_type === 'tv' ? 'TV Show' : 'Movie'} · {getYear(item)}
                          {item.vote_average > 0 && ` · ⭐ ${item.vote_average.toFixed(1)}`}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
