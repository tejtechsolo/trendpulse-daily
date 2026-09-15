import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { classifyRisk, scoreTopic } from '@/lib/news/risk';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = createAdminClient();
    const limit = Math.min(Number(process.env.NEWS_PROCESS_BATCH_SIZE ?? 10), 50);
    const { data: items, error } = await supabase
      .from('news_items')
      .select('id,title,description,category,status')
      .eq('status', 'new')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;

    let processed = 0;
    let routedToReview = 0;

    for (const item of items ?? []) {
      const risk = classifyRisk(item.title, item.description ?? '');
      const topicScore = scoreTopic(item.title, item.description ?? '', item.category);
      const status = risk === 'low' && topicScore >= 60 ? 'ready_for_review' : 'ready_for_review';

      const { error: updateError } = await supabase
        .from('news_items')
        .update({ status, risk_level: risk, topic_score: topicScore, processing_error: null })
        .eq('id', item.id);

      if (updateError) throw updateError;
      processed += 1;
      routedToReview += 1;
    }

    return NextResponse.json({ ok: true, processed, routedToReview, aiGeneration: 'not configured in this phase' });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Processing failed' }, { status: 500 });
  }
}
