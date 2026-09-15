import { requirePermission } from '@/lib/rbac';

export default async function OpportunitiesPage() {
  const { supabase } = await requirePermission('articles.review');
  const { data: opportunities } = await supabase
    .from('content_opportunities')
    .select('id,title,category,opportunity_score,trend_score,topic_score,rationale,suggested_keywords,status,source_url,created_at')
    .eq('status', 'new')
    .order('opportunity_score', { ascending: false })
    .limit(50);

  return (
    <main className="page-shell">
      <section className="section-heading">
        <p className="eyebrow">Content intelligence</p>
        <h1>Content opportunities</h1>
        <p className="muted">Fresh topics ranked from the news intelligence pipeline. Use these as editorial opportunities; they are not automatically published.</p>
      </section>
      <div className="stack-list">
        {(opportunities ?? []).map((item) => (
          <article className="notice-card" key={item.id}>
            <div className="split-row">
              <div>
                <span className="eyebrow">{item.category} · score {item.opportunity_score}</span>
                <h2>{item.title}</h2>
              </div>
              <strong>Trend {item.trend_score}</strong>
            </div>
            <p>{item.rationale}</p>
            <p className="muted">Keywords: {(item.suggested_keywords ?? []).join(', ') || '—'}</p>
            {item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer">Open source</a>}
          </article>
        ))}
        {!opportunities?.length && <div className="notice-card"><strong>No new opportunities yet.</strong><p>Run the content-opportunities cron after the news collector has populated the queue.</p></div>}
      </div>
    </main>
  );
}
