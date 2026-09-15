import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCategories } from '@/lib/articles';
import { updateArticle } from '@/app/admin/articles/actions';

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <main className="section container"><h1>Sign in required</h1><Link className="text-link" href="/admin/login">Go to login →</Link></main>;
  const [{ data: article }, categories] = await Promise.all([
    supabase.from('articles').select('*').eq('id', id).maybeSingle(),
    getCategories(),
  ]);
  if (!article) notFound();

  return (
    <main className="section container form-page">
      <div className="section-head"><div><div className="eyebrow">Content management</div><h1 className="page-title">Edit article</h1></div><Link className="text-link" href="/admin/articles">← Articles</Link></div>
      <form action={updateArticle} className="article-form">
        <input type="hidden" name="id" value={article.id}/>
        <label>Title<input name="title" required defaultValue={article.title}/></label>
        <label>Slug<input name="slug" required defaultValue={article.slug}/></label>
        <label>Excerpt<textarea name="excerpt" rows={3} defaultValue={article.excerpt ?? ''}/></label>
        <label>Content<textarea name="content" rows={16} required defaultValue={article.content}/></label>
        <label>Category<select name="category_id" defaultValue={article.category_id ?? ''}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Risk level<select name="risk_level" defaultValue={article.risk_level}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        <label>Status<select name="status" defaultValue={article.status}><option value="draft">Draft</option><option value="pending_review">Pending review</option><option value="published">Published</option><option value="rejected">Rejected</option><option value="scheduled">Scheduled</option><option value="archived">Archived</option></select></label>
        <label>Tags<input name="tags" defaultValue={(article.tags ?? []).join(', ')}/></label>
        <label>Cover image URL<input name="cover_image_url" type="url" defaultValue={article.cover_image_url ?? ''}/></label>
        <label>SEO title<input name="seo_title" defaultValue={article.seo_title ?? ''}/></label>
        <label>SEO description<textarea name="seo_description" rows={3} defaultValue={article.seo_description ?? ''}/></label>
        <div className="form-actions"><button className="button" type="submit">Save changes</button><Link className="text-link" href={`/articles/${article.slug}`}>View public article →</Link></div>
      </form>
    </main>
  );
}
