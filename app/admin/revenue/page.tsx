import { requirePermission } from '@/lib/rbac';

export default async function RevenuePage() {
  const { supabase } = await requirePermission('categories.manage');
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: events, error } = await supabase
    .from('revenue_events')
    .select('source, amount, currency, event_date, reference')
    .gte('event_date', since.toISOString().slice(0, 10))
    .order('event_date', { ascending: false });

  const rows = events ?? [];
  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const bySource = new Map<string, number>();
  for (const row of rows) bySource.set(row.source, (bySource.get(row.source) ?? 0) + Number(row.amount || 0));

  return <main className="section container">
    <div className="eyebrow">Admin monetization</div>
    <h1 className="page-title">Revenue overview</h1>
    <p className="muted">Verified revenue records for the last 30 days. This dashboard does not invent or estimate earnings.</p>
    {error && <p className="notice-card">Apply migration 0010 before using revenue tracking.</p>}
    <div className="stats-grid">
      <div className="stat-card"><strong>₹{total.toFixed(2)}</strong><span>Recorded revenue · 30 days</span></div>
      <div className="stat-card"><strong>{rows.length}</strong><span>Revenue events</span></div>
    </div>
    <h2>By source</h2>
    <ul>{[...bySource.entries()].map(([source, amount]) => <li key={source}>{source}: ₹{amount.toFixed(2)}</li>)}</ul>
    <h2>Recent records</h2>
    <ul>{rows.slice(0, 20).map((row, index) => <li key={`${row.event_date}-${row.source}-${index}`}>{row.event_date} · {row.source} · {row.currency} {Number(row.amount).toFixed(2)}{row.reference ? ` · ${row.reference}` : ''}</li>)}</ul>
  </main>;
}
