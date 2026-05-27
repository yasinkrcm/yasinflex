import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { signToken, setAuthCookie } from '@/lib/auth';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password)
      return NextResponse.json({ error: 'E-posta ve şifre zorunlu' }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 });

    const match = await user.comparePassword(password);
    if (!match)
      return NextResponse.json({ error: 'E-posta veya şifre hatalı' }, { status: 401 });

    const token = signToken({ id: user._id.toString(), email: user.email });

    const res = NextResponse.json({
      success: true,
      user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
    });

    return setAuthCookie(res, token);
  } catch (e) {
    console.error('Login error:', e);
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 });
  }
}
