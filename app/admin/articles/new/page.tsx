import Link from 'next/link';
import { getCategories } from '@/lib/articles';
import { createArticle } from '@/app/admin/articles/actions';

export default async function NewArticlePage() {
  const categories = await getCategories();
  return (
    <main className="section container form-page">
      <div className="section-head"><div><div className="eyebrow">Content management</div><h1 className="page-title">Create article</h1></div><Link className="text-link" href="/admin/articles">← Articles</Link></div>
      <form action={createArticle} className="article-form">
        <label>Title<input name="title" required placeholder="Enter article title" /></label>
        <label>Slug<input name="slug" placeholder="Leave blank to generate from title" /></label>
        <label>Excerpt<textarea name="excerpt" rows={3} placeholder="Short summary for cards and SEO" /></label>
        <label>Content<textarea name="content" rows={16} required placeholder="Write article content..." /></label>
        <label>Category<select name="category_id" defaultValue=""><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Risk level<select name="risk_level" defaultValue="low"><option value="low">Low — can qualify for auto-publish</option><option value="medium">Medium — review recommended</option><option value="high">High — admin approval required</option></select></label>
        <label>Tags<input name="tags" placeholder="ai, technology, startups" /></label>
        <label>Cover image URL<input name="cover_image_url" type="url" placeholder="https://..." /></label>
        <label>SEO title<input name="seo_title" placeholder="Optional SEO title" /></label>
        <label>SEO description<textarea name="seo_description" rows={3} placeholder="Optional meta description" /></label>
        <div className="form-actions"><button className="button" type="submit">Save draft</button><span className="muted">Drafts are stored in Supabase.</span></div>
      </form>
    </main>
  );
}
