import Link from 'next/link'

const statuses = [
  { label: 'Total articles', value: '0' },
  { label: 'Drafts', value: '0' },
  { label: 'Pending review', value: '0' },
  { label: 'Published', value: '0' },
]

export default function AdminArticlesPage() {
  return <main className="section container"><div className="section-head"><div><div className="eyebrow">Content management</div><h1 className="page-title">Articles</h1></div><Link className="button" href="/admin/articles/new">New article</Link></div><div className="stats-grid">{statuses.map((item) => <div className="stat-card" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div><div className="empty-state"><h2>No articles yet</h2><p>Create your first draft. Database-backed article management will be connected in the next implementation step.</p><Link className="text-link" href="/admin/articles/new">Create an article →</Link></div></main>
}
