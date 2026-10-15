import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signToken, setAuthCookie } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import User from '@/models/User';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: NextRequest) {
  const rl = rateLimit(req, 'register', 5, 60 * 60 * 1000);
  if (!rl.allowed)
    return NextResponse.json(
      { error: `Çok fazla deneme. ${rl.retryAfter} saniye sonra tekrar deneyin.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );

  try {
    await connectDB();
    const { username, email, password } = await req.json();

    if (
      typeof username !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !email.trim()
    )
      return NextResponse.json({ error: 'Tüm alanlar zorunlu' }, { status: 400 });

    if (!EMAIL_RE.test(email.trim()))
      return NextResponse.json({ error: 'Geçerli bir e-posta adresi girin' }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 30)
      return NextResponse.json({ error: 'Kullanıcı adı 3-30 karakter olmalı' }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ $or: [{ email: normalizedEmail }, { username: trimmedUsername }] });
    if (exists)
      return NextResponse.json({ error: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor' }, { status: 409 });

    const user = await User.create({ username: trimmedUsername, email: normalizedEmail, password });
    const token = signToken({ id: user._id.toString(), email: user.email });

    const res = NextResponse.json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
    }, { status: 201 });

    return setAuthCookie(res, token);
  } catch (e: unknown) {
    if (
      typeof e === 'object' &&
      e !== null &&
      'code' in e &&
      (e as { code?: number }).code === 11000
    )
      return NextResponse.json({ error: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor' }, { status: 409 });

    console.error('Register error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
