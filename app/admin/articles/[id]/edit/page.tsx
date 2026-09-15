import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '../../../../../lib/supabase/server';
import { getCategories } from '../../../../../lib/articles';
import { updateArticle } from '../../actions';
import { evaluateArticleQuality } from '../../../../../lib/news/quality';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="section container"><h1>Sign in required</h1><Link className="text-link" href="/admin/login">Go to login →</Link></main>;
  const [{ data: article }, categories] = await Promise.all([
    supabase.from('articles').select('*').eq('id', id).maybeSingle(), getCategories(),
  ]);
  if (!article) notFound();
  const quality = evaluateArticleQuality({ title: article.title, content: article.content, excerpt: article.excerpt, seoTitle: article.seo_title, seoDescription: article.seo_description, tags: article.tags ?? [], riskLevel: article.risk_level, sourceVerified: article.source_verified });

  return (
    <main className="section container form-page">
      <div className="section-head"><div><div className="eyebrow">Editorial workspace</div><h1 className="page-title">Edit article</h1></div><Link className="text-link" href="/admin/articles">← Articles</Link></div>
      <div className="article-row"><div><strong>Quality score</strong><div className="muted">{quality.score}/100 · {article.source_verified ? 'Source verified' : 'Source not verified'}</div></div><Link className="text-link" href={`/admin/articles/${article.id}/preview`}>Preview →</Link></div>
      <form action={updateArticle} className="article-form">
        <input type="hidden" name="id" value={article.id}/>
        <label>Title<input name="title" required defaultValue={article.title}/></label>
        <label>Slug<input name="slug" required defaultValue={article.slug}/></label>
        <label>Excerpt<textarea name="excerpt" rows={3} defaultValue={article.excerpt ?? ''}/></label>
        <label>Content<textarea name="content" rows={16} required defaultValue={article.content}/></label>
        <label>Category<select name="category_id" defaultValue={article.category_id ?? ''}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Risk level<select name="risk_level" defaultValue={article.risk_level}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Status<select name="status" defaultValue={article.status}><option value="draft">Draft</option><option value="pending_review">Pending review</option><option value="scheduled">Scheduled</option><option value="published">Published</option><option value="rejected">Rejected</option><option value="archived">Archived</option></select></label>
        <label>Schedule for (ISO datetime)<input name="scheduled_for" type="datetime-local" defaultValue={article.scheduled_for ? new Date(article.scheduled_for).toISOString().slice(0,16) : ''}/></label>
        <label>Tags<input name="tags" defaultValue={(article.tags ?? []).join(', ')}/></label>
        <label>Cover image URL<input name="cover_image_url" type="url" defaultValue={article.cover_image_url ?? ''}/></label>
        <label>SEO title<input name="seo_title" defaultValue={article.seo_title ?? ''}/></label>
        <label>SEO description<textarea name="seo_description" rows={3} defaultValue={article.seo_description ?? ''}/></label>
        <label className="checkbox-row"><input name="source_verified" type="checkbox" defaultChecked={article.source_verified}/><span>I verified the article facts against the source.</span></label>
        <label>Review notes<textarea name="review_notes" rows={4} defaultValue={article.review_notes ?? ''} placeholder="Editorial notes, verification details, or changes requested."/></label>
        {article.rejection_reason && <p className="muted">Previous rejection: {article.rejection_reason}</p>}
        <div className="form-actions"><button className="button" type="submit">Save / apply workflow status</button><Link className="text-link" href={`/articles/${article.slug}`}>View public article →</Link></div>
      </form>
    </main>
  );
}
