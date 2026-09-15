import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/rbac';
import { evaluateArticleQuality } from '@/lib/news/quality';

export default async function ArticlePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requirePermission('articles.review');
  const { data: article } = await supabase.from('articles').select('*, categories(name), sources(name,url)').eq('id', id).maybeSingle();
  if (!article) notFound();
  const quality = evaluateArticleQuality({ title: article.title, content: article.content, excerpt: article.excerpt, seoTitle: article.seo_title, seoDescription: article.seo_description, tags: article.tags ?? [], riskLevel: article.risk_level, sourceUrl: article.sources?.url, sourceVerified: article.source_verified });

  return <main className="section container article-page">
    <div className="section-head"><div><div className="eyebrow">Editorial preview · {article.status}</div><h1 className="page-title">{article.title}</h1></div><Link className="text-link" href={`/admin/articles/${id}/edit`}>Edit →</Link></div>
    <div className="article-row"><div><strong>Quality {quality.score}/100</strong><p className="muted">Risk: {article.risk_level} · Source: {article.source_verified ? 'verified' : 'unverified'}</p></div><div className="muted">{article.categories?.name ?? 'Uncategorized'}</div></div>
    {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
    <div className="article-body">{article.content.split(/\n\s*\n/).map((paragraph: string, index: number) => <p key={index}>{paragraph}</p>)}</div>
    <h2>Quality checks</h2>
    <ul>{Object.entries(quality.checks).map(([key, check]) => <li key={key}>{check.passed ? '✓' : '✗'} {key}: {check.message}</li>)}</ul>
    {article.sources?.url && <p className="muted">Source: <a href={article.sources.url} target="_blank" rel="noreferrer">{article.sources.name ?? article.sources.url}</a></p>}
  </main>;
}
