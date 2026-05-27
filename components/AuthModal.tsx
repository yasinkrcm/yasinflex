'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthModal() {
  const { authOpen, authTab, closeAuth, login, register, openAuth } = useAuth();
  const [tab, setTab]         = useState<'login' | 'register'>(authTab);
  const [username, setUsername] = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]  = useState('');
  const [error, setError]      = useState('');
  const [loading, setLoading]  = useState(false);

  useEffect(() => { setTab(authTab); }, [authTab]);
  useEffect(() => {
    if (authOpen) { setError(''); setUsername(''); setEmail(''); setPassword(''); setConfirm(''); }
  }, [authOpen]);

  if (!authOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'register') {
      if (password !== confirm) { setError('Şifreler eşleşmiyor'); return; }
      if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return; }
    }
    setLoading(true);
    const result = tab === 'login'
      ? await login(email, password)
      : await register(username, email, password);
    if (result.error) setError(result.error);
    setLoading(false);
  };

  return (
    <div className="auth-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeAuth(); }}>
      <div className="auth-modal">
        {/* Kapat */}
        <button className="auth-close" onClick={closeAuth} aria-label="Kapat">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="auth-logo">Yasin<span>flex</span></div>
        <p className="auth-subtitle">
          {tab === 'login' ? 'Hesabına giriş yap' : 'Ücretsiz hesap oluştur'}
        </p>

        {/* Tab seçici */}
        <div className="auth-tabs">
          <button
            id="auth-tab-login"
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >Giriş Yap</button>
          <button
            id="auth-tab-register"
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >Kayıt Ol</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {tab === 'register' && (
            <div className="auth-field">
              <label>Kullanıcı Adı</label>
              <input
                id="auth-username"
                type="text"
                placeholder="örn. filmizleyen42"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                minLength={3}
                autoComplete="username"
              />
            </div>
          )}

          <div className="auth-field">
            <label>E-posta</label>
            <input
              id="auth-email"
              type="email"
              placeholder="ornek@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label>Şifre</label>
            <input
              id="auth-password"
              type="password"
              placeholder="En az 6 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {tab === 'register' && (
            <div className="auth-field">
              <label>Şifre Tekrar</label>
              <input
                id="auth-confirm"
                type="password"
                placeholder="Şifreyi tekrar gir"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
          )}

          {error && (
            <div className="auth-error">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
              </svg>
              {error}
            </div>
          )}

          <button
            id="auth-submit"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? <span className="auth-spinner" />
              : tab === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'
            }
          </button>
        </form>

        <p className="auth-switch">
          {tab === 'login' ? 'Hesabın yok mu? ' : 'Zaten üye misin? '}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}>
            {tab === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}
          </button>
        </p>

        <div className="auth-guest-note">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Üye olmadan da izleyebilirsin — ilerleme tarayıcında saklanır
        </div>
      </div>
    </div>
  );
}
