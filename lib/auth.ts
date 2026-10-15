import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

// Prod secreta zorla; yoksa proses-geneli rastgele anahtar üret (restart'ta geçersiz olur)
const JWT_SECRET = process.env.JWT_SECRET || randomBytes(32).toString('hex');
if (!process.env.JWT_SECRET) {
  console.warn(
    'UYARI: JWT_SECRET tanımlı değil! Rastgele geçici anahtar kullanılıyor; sunucu yeniden başlatıldığında tüm oturumlar geçersizleşir. Prod ortamda mutlaka .env dosyasında tanımlayın.'
  );
}

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest) {
  const cookie = req.cookies.get('yasinflex_token')?.value;
  if (cookie) return cookie;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

export function getUserFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set('yasinflex_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return res;
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.delete('yasinflex_token');
  return res;
}
