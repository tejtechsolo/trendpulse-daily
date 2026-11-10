import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

type SearchRow = {
  report_date: string;
  query_text: string | null;
  page_url: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  average_position: number;
};

const number = (value: number) => new Intl.NumberFormat('en-IN').format(value);
const percent = (value: number) => `${(value * 100).toFixed(2)}%`;

export default async function SearchConsolePage() {
  const { supabase } = await requirePermission('categories.manage');
  const { data, error } = await supabase
    .from('search_performance')
    .select('report_date,query_text,page_url,clicks,impressions,ctr,average_position')
    .order('report_date', { ascending: false })
    .range(0, 24999);

  if (error) {
    return <main className="page-shell"><section className="section-heading"><p className="eyebrow">Search performance</p><h1>Google Search Console</h1><p className="muted">Unable to load search performance: {error.message}</p></section></main>;
  }

  const rows = (data ?? []) as SearchRow[];
  const totals = rows.reduce((sum, row) => ({
    clicks: sum.clicks + row.clicks,
    impressions: sum.impressions + row.impressions,
    positionWeighted: sum.positionWeighted + row.average_position * row.impressions,
  }), { clicks: 0, impressions: 0, positionWeighted: 0 });
  const ctr = totals.impressions ? totals.clicks / totals.impressions : 0;
  const position = totals.impressions ? totals.positionWeighted / totals.impressions : 0;

  const queryMap = new Map<string, { clicks: number; impressions: number; positionWeighted: number }>();
  const pageMap = new Map<string, { clicks: number; impressions: number }>();
  for (const row of rows) {
    if (row.query_text) {
      const item = queryMap.get(row.query_text) ?? { clicks: 0, impressions: 0, positionWeighted: 0 };
      item.clicks += row.clicks;
      item.impressions += row.impressions;
      item.positionWeighted += row.average_position * row.impressions;
      queryMap.set(row.query_text, item);
    }
    if (row.page_url) {
      const item = pageMap.get(row.page_url) ?? { clicks: 0, impressions: 0 };
      item.clicks += row.clicks;
      item.impressions += row.impressions;
      pageMap.set(row.page_url, item);
    }
  }
  const topQueries = [...queryMap.entries()].sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 20);
  const topPages = [...pageMap.entries()].sort((a, b) => b[1].clicks - a[1].clicks).slice(0, 15);
  const latestDate = rows[0]?.report_date;

  return <main className="page-shell">
    <section className="section-heading">
      <p className="eyebrow">Organic search analytics</p>
      <h1>Google Search Console</h1>
      <p className="muted">Daily query and page performance. Google typically delays finalized search data, so the sync intentionally ends three days behind today.</p>
      <p className="muted">{rows.length ? `Latest available date: ${latestDate}` : 'No Search Console data has been synced yet.'}</p>
    </section>

    <div className="stats-grid">
      <article className="stat-card"><span>Clicks</span><strong>{number(totals.clicks)}</strong></article>
      <article className="stat-card"><span>Impressions</span><strong>{number(totals.impressions)}</strong></article>
      <article className="stat-card"><span>Average CTR</span><strong>{percent(ctr)}</strong></article>
      <article className="stat-card"><span>Average position</span><strong>{position ? position.toFixed(1) : '—'}</strong></article>
    </div>

    <section className="table-card">
      <div className="section-heading"><h2>Top search queries</h2></div>
      {topQueries.length ? <div className="table-wrap"><table><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg. position</th></tr></thead><tbody>
        {topQueries.map(([query, item]) => <tr key={query}><td>{query}</td><td>{number(item.clicks)}</td><td>{number(item.impressions)}</td><td>{percent(item.impressions ? item.clicks / item.impressions : 0)}</td><td>{item.impressions ? (item.positionWeighted / item.impressions).toFixed(1) : '—'}</td></tr>)}
      </tbody></table></div> : <p className="muted">No query rows yet. Configure the service account and run the Search Console sync.</p>}
    </section>

    <section className="table-card">
      <div className="section-heading"><h2>Top landing pages</h2></div>
      {topPages.length ? <div className="table-wrap"><table><thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th><th>CTR</th></tr></thead><tbody>
        {topPages.map(([page, item]) => <tr key={page}><td><a href={page} target="_blank" rel="noreferrer">{page}</a></td><td>{number(item.clicks)}</td><td>{number(item.impressions)}</td><td>{percent(item.impressions ? item.clicks / item.impressions : 0)}</td></tr>)}
      </tbody></table></div> : <p className="muted">No landing-page data yet.</p>}
    </section>
  </main>;
}
