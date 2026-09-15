import { NextResponse } from 'next/server';
import { collectNews } from '@/lib/news/collector';
import { dedupeNews } from '@/lib/news/dedupe';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const collected = await collectNews();
    const unique = dedupeNews(collected);

    return NextResponse.json({
      ok: true,
      collected: collected.length,
      unique: unique.length,
      items: unique.slice(0, 50),
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Collection failed' }, { status: 500 });
  }
}
