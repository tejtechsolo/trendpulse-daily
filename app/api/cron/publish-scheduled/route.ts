import { createAdminClient } from '@/lib/supabase/admin';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data: due, error: readError } = await supabase.from('articles').select('id,slug').eq('status', 'scheduled').not('scheduled_for', 'is', null).lte('scheduled_for', now).limit(50);
  if (readError) return Response.json({ ok: false, error: readError.message }, { status: 500 });
  if (!due?.length) return Response.json({ ok: true, published: 0 });
  const ids = due.map((article) => article.id);
  const { error } = await supabase.from('articles').update({ status: 'published', published_at: now, scheduled_for: null }).in('id', ids);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true, published: ids.length });
}
