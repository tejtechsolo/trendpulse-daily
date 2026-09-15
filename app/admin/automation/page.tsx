import Link from 'next/link';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

function duration(ms: number | null) {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function AutomationPage() {
  const { supabase } = await requirePermission('articles.review');
  const [{ data: runs }, { count: queueCount }, { count: pendingCount }, { count: publishedCount }] = await Promise.all([
    supabase.from('automation_runs').select('id,job_name,status,started_at,finished_at,duration_ms,processed_count,success_count,failed_count,error_message').order('started_at', { ascending: false }).limit(50),
    supabase.from('news_items').select('id', { count: 'exact', head: true }).in('status', ['new', 'processing', 'ready_for_review']),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending_review'),
    supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
  ]);

  const failures = runs?.filter((run) => run.status === 'failed').length ?? 0;
  return <main className="page-shell">
    <section className="section-heading">
      <p className="eyebrow">Operations</p>
      <h1>Automation monitor</h1>
      <p className="muted">Monitor scheduled collection, AI processing and publishing jobs.</p>
    </section>

    <div className="stats-grid">
      <article className="stat-card"><span>Queue items</span><strong>{queueCount ?? 0}</strong></article>
      <article className="stat-card"><span>Pending review</span><strong>{pendingCount ?? 0}</strong></article>
      <article className="stat-card"><span>Published</span><strong>{publishedCount ?? 0}</strong></article>
      <article className="stat-card"><span>Recent failures</span><strong>{failures}</strong></article>
    </div>

    <div className="admin-links">
      <Link href="/admin/news">News intelligence</Link>
      <Link href="/admin/review">Review queue</Link>
      <Link href="/admin/analytics">Analytics</Link>
    </div>

    <section className="table-card">
      <div className="section-heading"><h2>Recent automation runs</h2></div>
      {runs?.length ? <div className="table-wrap"><table><thead><tr><th>Job</th><th>Status</th><th>Started</th><th>Duration</th><th>Processed</th><th>Failed</th><th>Error</th></tr></thead><tbody>
        {runs.map((run) => <tr key={run.id}>
          <td>{run.job_name}</td>
          <td>{run.status}</td>
          <td>{new Date(run.started_at).toLocaleString()}</td>
          <td>{duration(run.duration_ms)}</td>
          <td>{run.processed_count}</td>
          <td>{run.failed_count}</td>
          <td>{run.error_message ? run.error_message.slice(0, 120) : '—'}</td>
        </tr>)}
      </tbody></table></div> : <p className="muted">No automation runs recorded yet. Run the GitHub Actions workflow after applying migration 0011.</p>}
    </section>
  </main>;
}
