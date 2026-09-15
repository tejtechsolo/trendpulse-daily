import { NextResponse } from 'next/server';
import { collectNews } from '@/lib/news/collector';
import { dedupeNews } from '@/lib/news/dedupe';
import { ingestNews } from '@/lib/news/ingest';
import { finishAutomationRun, startAutomationRun } from '@/lib/automation/runs';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let run: Awaited<ReturnType<typeof startAutomationRun>> | null = null;
  try {
    run = await startAutomationRun('collect-news');
    const collected = await collectNews();
    const unique = dedupeNews(collected);
    const ingestion = await ingestNews(unique);
    await finishAutomationRun(run.id, run.startedAt, {
      success: true,
      processed: unique.length,
      succeeded: ingestion.inserted,
      metadata: { collected: collected.length, unique: unique.length },
    });

    return NextResponse.json({ ok: true, collected: collected.length, unique: unique.length, inserted: ingestion.inserted, items: unique.slice(0, 50), collectedAt: new Date().toISOString() });
  } catch (error) {
    if (run) await finishAutomationRun(run.id, run.startedAt, { success: false, error: error instanceof Error ? error.message : 'Collection failed' });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Collection failed' }, { status: 500 });
  }
}
