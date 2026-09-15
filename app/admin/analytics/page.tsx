import { requirePermission } from '@/lib/rbac';

export default async function AnalyticsPage() {
  const { supabase } = await requirePermission('categories.manage');
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: events, error } = await supabase
    .from('article_events')
    .select('article_id, event_type, created_at, articles(title, slug)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1000);

  const rows = events ?? [];
  const views = rows.filter((event) => event.event_type === 'page_view');
  const counts = new Map<string, { title: string; slug: string; views: number }>();
  for (const event of views) {
    const article = Array.isArray(event.articles) ? event.articles[0] : event.articles;
    if (!article) continue;
    const current = counts.get(event.article_id) ?? { title: article.title, slug: article.slug, views: 0 };
    current.views += 1;
    counts.set(event.article_id, current);
  }
  const topArticles = [...counts.values()].sort((a, b) => b.views - a.views).slice(0, 10);

  return <main className="section container">
    <div className="eyebrow">Admin analytics</div>
    <h1 className="page-title">Content performance</h1>
    {error && <p>Analytics are unavailable until migration 0009 is applied.</p>}
    <div className="stats-grid"><div className="stat-card"><strong>{views.length}</strong><span>Page views · last 30 days</span></div><div className="stat-card"><strong>{counts.size}</strong><span>Articles viewed</span></div></div>
    <h2>Top articles</h2>
    <ol>{topArticles.map((article) => <li key={article.slug}><a href={`/articles/${article.slug}`}>{article.title}</a> — {article.views} views</li>)}</ol>
  </main>;
}
