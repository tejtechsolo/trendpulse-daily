import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articleId = typeof body.articleId === 'string' ? body.articleId : '';
    const source = typeof body.source === 'string' ? body.source.slice(0, 100) : null;
    const referrer = typeof body.referrer === 'string' ? body.referrer.slice(0, 500) : null;

    if (!articleId) return NextResponse.json({ error: 'articleId is required' }, { status: 400 });

    const supabase = createAdminClient();
    const { data: article, error: articleError } = await supabase
      .from('articles').select('id').eq('id', articleId).eq('status', 'published').maybeSingle();
    if (articleError) throw articleError;
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

    const { error } = await supabase.from('article_events').insert({
      article_id: articleId, event_type: 'page_view', source, referrer,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Analytics pageview error:', error);
    return NextResponse.json({ error: 'Unable to record event' }, { status: 500 });
  }
}
