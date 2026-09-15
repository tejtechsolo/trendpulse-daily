import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { classifyRisk, scoreTopic } from '@/lib/news/risk';
import { generateArticle } from '@/lib/news/generator';
import { finishAutomationRun, startAutomationRun } from '@/lib/automation/runs';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}
function uniqueSlug(base: string, id: string) {
  const clean = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return `${clean || 'news'}-${id.slice(0, 8)}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const supabase = createAdminClient();
  const limit = Math.min(Number(process.env.NEWS_PROCESS_BATCH_SIZE ?? 5), 20);
  let run: Awaited<ReturnType<typeof startAutomationRun>> | null = null;
  try {
    run = await startAutomationRun('process-news');
    const { data: items, error } = await supabase.from('news_items').select('id,title,description,category,source_name,source_url,published_at,status').eq('status', 'new').order('created_at', { ascending: true }).limit(limit);
    if (error) throw error;
    let processed = 0, generated = 0, failed = 0;
    for (const item of items ?? []) {
      const risk = classifyRisk(item.title, item.description ?? '');
      const topicScore = scoreTopic(item.title, item.description ?? '', item.category);
      await supabase.from('news_items').update({ status: 'processing', risk_level: risk, topic_score: topicScore, processing_error: null }).eq('id', item.id);
      try {
        const generatedArticle = await generateArticle({ title: item.title, url: item.source_url, source: item.source_name, category: item.category, publishedAt: item.published_at, description: item.description });
        const { data: category } = await supabase.from('categories').select('id').eq('slug', item.category).maybeSingle();
        const { data: source } = await supabase.from('sources').upsert({ name: item.source_name, url: item.source_url, source_type: 'news', is_trusted: false }, { onConflict: 'url' }).select('id').maybeSingle();
        const slug = uniqueSlug(generatedArticle.slug || generatedArticle.title, item.id);
        const { data: article, error: articleError } = await supabase.from('articles').insert({ title: generatedArticle.title, slug, excerpt: generatedArticle.excerpt, content: generatedArticle.content, category_id: category?.id ?? null, source_id: source?.id ?? null, status: 'pending_review', risk_level: risk, seo_title: generatedArticle.seoTitle, seo_description: generatedArticle.seoDescription, tags: generatedArticle.tags }).select('id').single();
        if (articleError) throw articleError;
        const { error: queueError } = await supabase.from('news_items').update({ status: 'converted', article_id: article.id, ai_model: process.env.AI_MODEL || 'gemini-3.5-flash-lite', generated_at: new Date().toISOString(), generated_payload: generatedArticle, processing_error: null }).eq('id', item.id);
        if (queueError) throw queueError;
        processed += 1; generated += 1;
      } catch (error) {
        failed += 1;
        await supabase.from('news_items').update({ status: 'ready_for_review', processing_error: error instanceof Error ? error.message : 'Generation failed' }).eq('id', item.id);
      }
    }
    await finishAutomationRun(run.id, run.startedAt, { success: failed === 0, processed: items?.length ?? 0, succeeded: generated, failed, metadata: { batchSize: limit, awaitingReview: generated } });
    return NextResponse.json({ ok: true, processed, generated, failed, articlesAwaitingReview: generated });
  } catch (error) {
    if (run) await finishAutomationRun(run.id, run.startedAt, { success: false, error: error instanceof Error ? error.message : 'Processing failed' });
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Processing failed' }, { status: 500 });
  }
}
