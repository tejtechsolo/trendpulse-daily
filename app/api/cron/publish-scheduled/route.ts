import { createAdminClient } from '@/lib/supabase/admin';
import { finishAutomationRun, startAutomationRun } from '@/lib/automation/runs';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  let run: Awaited<ReturnType<typeof startAutomationRun>> | null = null;
  try {
    run = await startAutomationRun('publish-scheduled');
    const { data: due, error: readError } = await supabase.from('articles').select('id,slug').eq('status', 'scheduled').not('scheduled_for', 'is', null).lte('scheduled_for', now).limit(50);
    if (readError) throw readError;
    if (!due?.length) {
      await finishAutomationRun(run.id, run.startedAt, { success: true, metadata: { due: 0 } });
      return Response.json({ ok: true, published: 0 });
    }
    const ids = due.map((article) => article.id);
    const { error } = await supabase.from('articles').update({ status: 'published', published_at: now, scheduled_for: null }).in('id', ids);
    if (error) throw error;
    await finishAutomationRun(run.id, run.startedAt, { success: true, processed: ids.length, succeeded: ids.length, metadata: { publishedSlugs: due.map((article) => article.slug) } });
    return Response.json({ ok: true, published: ids.length });
  } catch (error) {
    if (run) await finishAutomationRun(run.id, run.startedAt, { success: false, error: error instanceof Error ? error.message : 'Publishing failed' });
    return Response.json({ ok: false, error: error instanceof Error ? error.message : 'Publishing failed' }, { status: 500 });
  }
}
