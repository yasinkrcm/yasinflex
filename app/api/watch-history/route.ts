import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import WatchHistory from '@/models/WatchHistory';

// GET /api/watch-history?mediaId=xxx&mediaType=movie
export async function GET(req: NextRequest) {
  await connectDB();
  const payload = getUserFromRequest(req);
  const { searchParams } = new URL(req.url);
  const mediaId = searchParams.get('mediaId');
  const mediaType = searchParams.get('mediaType');
  const guestId = searchParams.get('guestId');

  const query: Record<string, unknown> = {};
  if (payload) query.userId = payload.id;
  else if (guestId) query.guestId = guestId;
  else return NextResponse.json({ history: [] });

  if (mediaId) query.mediaId = Number(mediaId);
  if (mediaType) query.mediaType = mediaType;

  const history = await WatchHistory.find(query)
    .sort({ updatedAt: -1 })
    .limit(mediaId ? 1 : 50)
    .lean();

  return NextResponse.json({ history });
}

// POST /api/watch-history — kaydet / güncelle
export async function POST(req: NextRequest) {
  await connectDB();
  const payload = getUserFromRequest(req);
  const body = await req.json();
  const { mediaId, mediaType, title, poster, season, episode, progress, duration, guestId } = body;

  const filter: Record<string, unknown> = { mediaId, mediaType };
  if (payload) filter.userId = payload.id;
  else if (guestId) filter.guestId = guestId;
  else return NextResponse.json({ error: 'Kimlik gerekli' }, { status: 400 });

  const update = {
    title, poster,
    season: season ?? 1,
    episode: episode ?? 1,
    progress: progress ?? 0,
    duration: duration ?? 0,
    updatedAt: new Date(),
    ...(payload ? { userId: payload.id } : { guestId }),
  };

  const doc = await WatchHistory.findOneAndUpdate(filter, update, { upsert: true, new: true });
  return NextResponse.json({ success: true, doc });
}

// DELETE /api/watch-history?id=xxx
export async function DELETE(req: NextRequest) {
  await connectDB();
  const payload = getUserFromRequest(req);
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

  const filter: Record<string, unknown> = { _id: id };
  if (payload) filter.userId = payload.id;
  await WatchHistory.findOneAndDelete(filter);
  return NextResponse.json({ success: true });
}
