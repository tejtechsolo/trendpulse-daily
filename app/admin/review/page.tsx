import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { changeArticleStatus } from '@/app/admin/articles/actions';
import { evaluateArticleQuality } from '@/lib/news/quality';

export default async function ReviewPage() {
  const { supabase } = await requirePermission('articles.review');
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,content,seo_title,seo_description,tags,risk_level,source_verified,created_at,categories(name),sources(name,url)')
    .eq('status', 'pending_review').order('created_at', { ascending: false });
  if (error) redirect('/admin');

  return <main className="page-shell">
    <section className="section-heading"><p className="eyebrow">Editorial workflow</p><h1>Review queue</h1><p className="muted">Verify source facts, inspect quality checks, then publish or schedule.</p></section>
    <div className="article-list">
      {articles?.length ? articles.map((article) => {
        const quality = evaluateArticleQuality({ title: article.title, content: article.content, excerpt: article.excerpt, seoTitle: article.seo_title, seoDescription: article.seo_description, tags: article.tags ?? [], riskLevel: article.risk_level, sourceUrl: article.sources?.[0]?.url, sourceVerified: article.source_verified });
        return <article className="article-row" key={article.id}>
          <div><h2>{article.title}</h2><p className="muted">{article.categories?.[0]?.name ?? 'Uncategorized'} · Risk: {article.risk_level} · Quality: {quality.score}/100 · {article.source_verified ? 'Source verified' : 'Source needs verification'}</p></div>
          <div className="row-actions">
            <Link href={`/admin/articles/${article.id}/preview`}>Preview</Link><Link href={`/admin/articles/${article.id}/edit`}>Edit</Link>
            <form action={changeArticleStatus}><input type="hidden" name="id" value={article.id}/><input type="hidden" name="status" value="published"/><input type="hidden" name="source_verified" value={article.source_verified ? 'on' : ''}/><button type="submit">Publish</button></form>
            <form action={changeArticleStatus}><input type="hidden" name="id" value={article.id}/><input type="hidden" name="status" value="scheduled"/><input name="scheduled_for" type="datetime-local" aria-label={`Schedule ${article.title}`}/><button type="submit">Schedule</button></form>
            <form action={changeArticleStatus}><input type="hidden" name="id" value={article.id}/><input type="hidden" name="status" value="rejected"/><input name="rejection_reason" placeholder="Reason (optional)" aria-label={`Rejection reason for ${article.title}`}/><button type="submit">Reject</button></form>
          </div>
        </article>;
      }) : <p className="muted">No articles are waiting for review.</p>}
    </div>
  </main>;
}
