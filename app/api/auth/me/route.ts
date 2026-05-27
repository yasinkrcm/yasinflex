import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserFromRequest, clearAuthCookie } from '@/lib/auth';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  const payload = getUserFromRequest(req);
  if (!payload) return NextResponse.json({ user: null }, { status: 401 });

  await connectDB();
  const user = await User.findById(payload.id).select('-password');
  if (!user) return NextResponse.json({ user: null }, { status: 401 });

  return NextResponse.json({
    user: { id: user._id, username: user.username, email: user.email, avatar: user.avatar },
  });
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  return clearAuthCookie(res);
}
