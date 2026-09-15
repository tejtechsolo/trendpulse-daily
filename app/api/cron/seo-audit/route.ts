import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function scoreArticle(article: {
  title: string;
  excerpt: string | null;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[] | null;
  source_id: string | null;
  quality_score: number | null;
  cover_image_url: string | null;
}) {
  const checks = {
    title: article.title.trim().length >= 30 && article.title.trim().length <= 70,
    excerpt: Boolean(article.excerpt?.trim()) && (article.excerpt?.length ?? 0) >= 80,
    content: article.content.trim().length >= 1200,
    seoTitle: Boolean(article.seo_title?.trim()) && (article.seo_title?.length ?? 0) <= 65,
    seoDescription: Boolean(article.seo_description?.trim()) && (article.seo_description?.length ?? 0) >= 120 && (article.seo_description?.length ?? 0) <= 170,
    tags: (article.tags?.length ?? 0) >= 2,
    source: Boolean(article.source_id),
    quality: (article.quality_score ?? 0) >= 80,
    image: Boolean(article.cover_image_url),
  };
  const passed = Object.values(checks).filter(Boolean).length;
  return { score: Math.round((passed / Object.keys(checks).length) * 100), checks };
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createAdminClient();
  const started = Date.now();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,content,seo_title,seo_description,tags,source_id,quality_score,cover_image_url,published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = (articles ?? []).map((article) => {
    const audit = scoreArticle(article);
    return { id: article.id, title: article.title, slug: article.slug, score: audit.score, checks: audit.checks };
  });

  const failing = results.filter((item) => item.score < 80);
  const summary = {
    articles: results.length,
    audited: results.length,
    passing: results.length - failing.length,
    failing: failing.length,
    averageScore: results.length ? Math.round(results.reduce((sum, item) => sum + item.score, 0) / results.length) : 0,
    generatedAt: new Date().toISOString(),
  };

  await supabase.from('automation_runs').insert({
    job_name: 'seo-audit',
    status: 'success',
    started_at: new Date(started).toISOString(),
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - started,
    processed_count: results.length,
    success_count: summary.passing,
    failed_count: summary.failing,
    metadata: summary,
  });

  return NextResponse.json({ ok: true, summary, failures: failing.slice(0, 50) });
}
