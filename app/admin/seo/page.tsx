import Link from 'next/link';
import { requirePermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[] | null;
  source_id: string | null;
  quality_score: number | null;
  cover_image_url: string | null;
};

function audit(article: Article) {
  const checks = [
    ['Title', article.title.trim().length >= 30 && article.title.trim().length <= 70],
    ['Excerpt', Boolean(article.excerpt?.trim()) && (article.excerpt?.length ?? 0) >= 80],
    ['Content length', article.content.trim().length >= 1200],
    ['SEO title', Boolean(article.seo_title?.trim()) && (article.seo_title?.length ?? 0) <= 65],
    ['SEO description', Boolean(article.seo_description?.trim()) && (article.seo_description?.length ?? 0) >= 120 && (article.seo_description?.length ?? 0) <= 170],
    ['Tags', (article.tags?.length ?? 0) >= 2],
    ['Source attribution', Boolean(article.source_id)],
    ['Quality score', (article.quality_score ?? 0) >= 80],
    ['Cover image', Boolean(article.cover_image_url)],
  ];
  const score = Math.round((checks.filter(([, passed]) => passed).length / checks.length) * 100);
  return { score, checks };
}

export default async function SeoPage() {
  const { supabase } = await requirePermission('categories.manage');
  const { data } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,content,seo_title,seo_description,tags,source_id,quality_score,cover_image_url')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const articles = (data ?? []) as Article[];
  const audits = articles.map((article) => ({ article, ...audit(article) }));
  const average = audits.length ? Math.round(audits.reduce((sum, item) => sum + item.score, 0) / audits.length) : 0;
  const passing = audits.filter((item) => item.score >= 80).length;
  const issues = audits.filter((item) => item.score < 80);

  return <main className="page-shell">
    <section className="section-heading">
      <p className="eyebrow">SEO operations</p>
      <h1>SEO & content quality</h1>
      <p className="muted">First-party audit of published articles. Search Console metrics can be connected separately once the Google property is configured.</p>
    </section>

    <div className="stats-grid">
      <article className="stat-card"><span>Published articles</span><strong>{articles.length}</strong></article>
      <article className="stat-card"><span>Average SEO score</span><strong>{average}%</strong></article>
      <article className="stat-card"><span>Passing</span><strong>{passing}</strong></article>
      <article className="stat-card"><span>Needs attention</span><strong>{issues.length}</strong></article>
    </div>

    <div className="admin-links">
      <Link href="/admin/automation">Automation monitor</Link>
      <Link href="/admin/analytics">Analytics</Link>
      <Link href="/admin/articles">Articles</Link>
    </div>

    <section className="table-card">
      <div className="section-heading"><h2>Articles needing attention</h2></div>
      {issues.length ? <div className="table-wrap"><table><thead><tr><th>Article</th><th>Score</th><th>Failed checks</th><th>Action</th></tr></thead><tbody>
        {issues.map(({ article, score, checks }) => <tr key={article.id}>
          <td>{article.title}</td>
          <td>{score}%</td>
          <td>{checks.filter(([, passed]) => !passed).map(([name]) => name).join(', ')}</td>
          <td><Link href={`/admin/articles/${article.id}/edit`}>Edit</Link></td>
        </tr>)}
      </tbody></table></div> : <p className="muted">All published articles currently pass the audit.</p>}
    </section>
  </main>;
}
