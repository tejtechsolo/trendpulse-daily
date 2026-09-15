import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { changeArticleStatus } from '@/app/admin/articles/actions';

export default async function ReviewPage() {
  const { supabase } = await requirePermission('articles.review');
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, slug, risk_level, created_at, categories(name)')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false });

  if (error) redirect('/admin');

  return (
    <main className="page-shell">
      <section className="section-heading">
        <p className="eyebrow">Editorial workflow</p>
        <h1>Review queue</h1>
        <p className="muted">Approve or reject articles before publication.</p>
      </section>
      <div className="article-list">
        {articles?.length ? articles.map((article) => (
          <article className="article-row" key={article.id}>
            <div>
              <h2>{article.title}</h2>
              <p className="muted">{article.categories?.[0]?.name ?? 'Uncategorized'} · Risk: {article.risk_level} · {new Date(article.created_at).toLocaleString()}</p>
            </div>
            <div className="row-actions">
              <Link href={`/admin/articles/${article.id}/edit`}>Edit</Link>
              <form action={changeArticleStatus}>
                <input type="hidden" name="id" value={article.id} />
                <input type="hidden" name="status" value="published" />
                <button type="submit">Approve & publish</button>
              </form>
              <form action={changeArticleStatus}>
                <input type="hidden" name="id" value={article.id} />
                <input type="hidden" name="status" value="rejected" />
                <input name="rejection_reason" placeholder="Reason (optional)" aria-label={`Rejection reason for ${article.title}`} />
                <button type="submit">Reject</button>
              </form>
            </div>
          </article>
        )) : <p className="muted">No articles are waiting for review.</p>}
      </div>
    </main>
  );
}
