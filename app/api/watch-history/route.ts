import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getUserFromRequest } from '@/lib/auth';
import WatchHistory from '@/models/WatchHistory';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const MAX_STRING = 512;

function sanitizeGuestId(v: string | null): string | null {
  if (typeof v !== 'string' || v.length < 6 || v.length > 64) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(v)) return null;
  return v;
}

function clampNumber(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// GET /api/watch-history?mediaId=xxx&mediaType=movie&guestId=x
export async function GET(req: NextRequest) {
  await connectDB();
  const payload = getUserFromRequest(req);
  const { searchParams } = new URL(req.url);

  const query: Record<string, unknown> = {};
  if (payload) query.userId = payload.id;
  else {
    const guestId = sanitizeGuestId(searchParams.get('guestId'));
    if (!guestId) return NextResponse.json({ history: [] });
    query.guestId = guestId;
  }

  const mediaId = Number(searchParams.get('mediaId'));
  if (Number.isInteger(mediaId) && mediaId > 0) query.mediaId = mediaId;

  const mediaType = searchParams.get('mediaType');
  if (mediaType === 'movie' || mediaType === 'tv') query.mediaType = mediaType;

  const history = await WatchHistory.find(query)
    .sort({ updatedAt: -1 })
    .limit(searchParams.get('mediaId') ? 1 : 50)
    .lean();

  return NextResponse.json({ history });
}

// POST /api/watch-history — kaydet / güncelle
export async function POST(req: NextRequest) {
  await connectDB();
  const payload = getUserFromRequest(req);
  const body = await req.json().catch(() => null);
  if (typeof body !== 'object' || body === null)
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });

  const b = body as Record<string, unknown>;
  const mediaId = typeof b.mediaId === 'number' ? b.mediaId : Number(b.mediaId);
  const mediaType = b.mediaType;
  let guestId: string | null = typeof b.guestId === 'string' ? b.guestId : null;

  if (!Number.isInteger(mediaId) || mediaId < 1)
    return NextResponse.json({ error: 'Geçersiz mediaId' }, { status: 400 });
  if (mediaType !== 'movie' && mediaType !== 'tv')
    return NextResponse.json({ error: 'Geçersiz medya tipi' }, { status: 400 });

  const title = typeof b.title === 'string' ? b.title.slice(0, 200) : '';
  const poster = typeof b.poster === 'string' ? b.poster.slice(0, MAX_STRING) : '';

  const filter: Record<string, unknown> = { mediaId, mediaType };
  if (payload) filter.userId = payload.id;
  else {
    guestId = sanitizeGuestId(guestId || null);
    if (!guestId) return NextResponse.json({ error: 'Kimlik gerekli' }, { status: 400 });
    filter.guestId = guestId;
  }

  const update = {
    title,
    poster,
    season: clampNumber(b.season, 1, 100, 1),
    episode: clampNumber(b.episode, 1, 2000, 1),
    progress: clampNumber(b.progress, 0, 100, 0),
    duration: clampNumber(b.duration, 0, 3600 * 24, 0),
    updatedAt: new Date(),
    ...(payload ? { userId: payload.id } : { guestId }),
  };

  const doc = await WatchHistory.findOneAndUpdate(filter, update, { upsert: true, new: true });
  return NextResponse.json({ success: true, doc });
}

// DELETE /api/watch-history?id=xxx&guestId=x
export async function DELETE(req: NextRequest) {
  await connectDB();
  const payload = getUserFromRequest(req);
  const { searchParams } = new URL(req.url);
  const rawId = searchParams.get('id');

  if (!rawId || !OBJECT_ID_RE.test(rawId))
    return NextResponse.json({ error: 'ID gerekli' }, { status: 400 });

  const guestId = sanitizeGuestId(searchParams.get('guestId'));

  if (!payload && !guestId)
    return NextResponse.json({ error: 'Kimlik gerekli' }, { status: 401 });

  const filter: Record<string, unknown> = { _id: rawId };
  if (payload) {
    filter.userId = payload.id;
  } else {
    filter.guestId = guestId;
  }

  await WatchHistory.findOneAndDelete(filter);
  return NextResponse.json({ success: true });
}
