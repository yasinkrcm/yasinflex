import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signToken, setAuthCookie } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, email, password } = await req.json();

    if (!username || !email || !password)
      return NextResponse.json({ error: 'Tüm alanlar zorunlu' }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists)
      return NextResponse.json({ error: 'Bu e-posta veya kullanıcı adı zaten kullanılıyor' }, { status: 409 });

    const user = await User.create({ username, email, password });
    const token = signToken({ id: user._id.toString(), email: user.email });

    const res = NextResponse.json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
    }, { status: 201 });

    return setAuthCookie(res, token);
  } catch (e: unknown) {
    console.error('Register error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
