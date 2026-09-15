import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { changeArticleStatus } from '@/app/admin/articles/actions';

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="section container"><h1>Sign in required</h1><Link className="text-link" href="/admin/login">Go to login →</Link></main>;

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id,title,slug,status,risk_level,published_at,updated_at,categories(name)')
    .order('updated_at', { ascending: false });

  const rows = articles ?? [];
  const count = (status: string) => rows.filter((a) => a.status === status).length;

  return (
    <main className="section container">
      <div className="section-head"><div><div className="eyebrow">Content management</div><h1 className="page-title">Articles</h1></div><Link className="button" href="/admin/articles/new">New article</Link></div>
      {error && <p className="form-error">Unable to load articles: {error.message}</p>}
      <div className="stats-grid">
        <div className="stat-card"><span>Total articles</span><strong>{rows.length}</strong></div>
        <div className="stat-card"><span>Drafts</span><strong>{count('draft')}</strong></div>
        <div className="stat-card"><span>Pending review</span><strong>{count('pending_review')}</strong></div>
        <div className="stat-card"><span>Published</span><strong>{count('published')}</strong></div>
      </div>
      {rows.length === 0 ? <div className="empty-state"><h2>No articles yet</h2><p>Create your first draft.</p><Link className="text-link" href="/admin/articles/new">Create an article →</Link></div> : (
        <div className="article-table-wrap"><table className="article-table"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Risk</th><th>Updated</th><th>Actions</th></tr></thead><tbody>{rows.map((article) => <tr key={article.id}><td><Link href={`/admin/articles/${article.id}/edit`}>{article.title}</Link></td><td>{article.categories?.[0]?.name ?? '—'}</td><td><span className="status-badge">{article.status}</span></td><td>{article.risk_level}</td><td>{new Date(article.updated_at).toLocaleDateString('en-IN')}</td><td><div className="inline-actions"><Link className="text-link" href={`/admin/articles/${article.id}/edit`}>Edit</Link>{article.status !== 'published' && <form action={changeArticleStatus}><input type="hidden" name="id" value={article.id}/><input type="hidden" name="status" value="published"/><button className="link-button" type="submit">Publish</button></form>}</div></td></tr>)}</tbody></table></div>
      )}
    </main>
  );
}
