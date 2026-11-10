import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchSearchPerformance, mapSearchPerformanceRow } from '@/lib/google/search-console';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const started = Date.now();
  try {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 27);
    const startDate = isoDate(start);
    const endDate = isoDate(end);

    const rows = await fetchSearchPerformance(startDate, endDate);
    const supabase = createAdminClient();
    const payload = rows.map(mapSearchPerformanceRow).filter((row) => Boolean(row.report_date));

    let upserted = 0;
    for (let offset = 0; offset < payload.length; offset += 500) {
      const batch = payload.slice(offset, offset + 500);
      const { error } = await supabase
        .from('search_performance')
        .upsert(batch, { onConflict: 'report_date,dimension_key' });
      if (error) throw new Error(`Search performance upsert failed: ${error.message}`);
      upserted += batch.length;
    }

    await supabase.from('automation_runs').insert({
      job_name: 'search-console-sync',
      status: 'success',
      started_at: new Date(started).toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - started,
      processed_count: rows.length,
      success_count: upserted,
      failed_count: 0,
      metadata: { startDate, endDate, rowsReturned: rows.length, rowsUpserted: upserted },
    });

    return NextResponse.json({ ok: true, startDate, endDate, rowsReturned: rows.length, rowsUpserted: upserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search Console sync failed';
    try {
      const supabase = createAdminClient();
      await supabase.from('automation_runs').insert({
        job_name: 'search-console-sync',
        status: 'failed',
        started_at: new Date(started).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - started,
        failed_count: 1,
        metadata: { error: message },
      });
    } catch {
      // Preserve the original integration error if monitoring storage is unavailable.
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
