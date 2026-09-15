import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const started = Date.now();
  const checks: Record<string, string> = { app: 'ok' };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('articles').select('id', { count: 'exact', head: true });
    checks.supabase = error ? 'error' : 'ok';
    const healthy = !error;
    return NextResponse.json({
      ok: healthy,
      checks,
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { status: healthy ? 200 : 503 });
  } catch (error) {
    checks.supabase = 'error';
    return NextResponse.json({
      ok: false,
      checks,
      error: error instanceof Error ? error.message : 'Health check failed',
      latency_ms: Date.now() - started,
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
