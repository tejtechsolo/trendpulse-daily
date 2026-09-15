import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { opportunityKey, opportunityRationale, opportunityScore, keywordSuggestions } from '@/lib/news/opportunities';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const startedAt = new Date().toISOString();
  let inserted = 0;
  let failed = 0;

  const { data: news, error } = await supabase
    .from('news_items')
    .select('id,title,description,category,source_url,topic_score,published_at')
    .in('status', ['new', 'ready_for_review', 'converted'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  for (const item of news ?? []) {
    const score = opportunityScore({ title: item.title, category: item.category, topicScore: item.topic_score, publishedAt: item.published_at });
    if (score < 45) continue;

    const normalized = opportunityKey(item.title);
    const { error: upsertError } = await supabase.from('content_opportunities').upsert({
      title: item.title,
      normalized_title: normalized,
      category: item.category,
      source_type: 'news',
      source_url: item.source_url,
      source_news_item_id: item.id,
      opportunity_score: score,
      trend_score: Math.min(100, Math.round(score * 0.7)),
      topic_score: item.topic_score,
      rationale: opportunityRationale(score, item.title),
      suggested_keywords: keywordSuggestions(item.title, item.description ?? ''),
      metadata: { generated_at: startedAt },
    }, { onConflict: 'normalized_title', ignoreDuplicates: false });

    if (upsertError) failed++;
    else inserted++;
  }

  return NextResponse.json({ ok: true, considered: news?.length ?? 0, upserted: inserted, failed });
}
