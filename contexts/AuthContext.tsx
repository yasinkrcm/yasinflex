'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  guestId: string;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  openAuth: (tab?: 'login' | 'register') => void;
  closeAuth: () => void;
  authOpen: boolean;
  authTab: 'login' | 'register';
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [guestId, setGuestId] = useState('');

  // Misafir ID oluştur (localStorage)
  useEffect(() => {
    let id = localStorage.getItem('yasinflex_guest_id');
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2) + Date.now();
      localStorage.setItem('yasinflex_guest_id', id);
    }
    setGuestId(id);
  }, []);

  // Oturumu kontrol et
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    setUser(d.user);
    setAuthOpen(false);
    return {};
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const r = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const d = await r.json();
    if (!r.ok) return { error: d.error };
    setUser(d.user);
    setAuthOpen(false);
    return {};
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/me', { method: 'DELETE' });
    setUser(null);
  }, []);

  const openAuth = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => setAuthOpen(false), []);

  return (
    <AuthContext.Provider value={{ user, loading, guestId, login, register, logout, openAuth, closeAuth, authOpen, authTab }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
