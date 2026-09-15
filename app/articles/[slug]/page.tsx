import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedArticle } from '@/lib/articles';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: 'Article not found | TrendPulse Daily' };
  return {
    title: article.seo_title || article.title,
    description: article.seo_description || article.excerpt || undefined,
    keywords: article.tags,
    openGraph: { title: article.seo_title || article.title, description: article.seo_description || article.excerpt || undefined, images: article.cover_image_url ? [article.cover_image_url] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();

  return (
    <main className="section container article-page">
      <div className="eyebrow">{article.categories?.name ?? 'News'}</div>
      <h1 className="page-title">{article.title}</h1>
      {article.published_at && <div className="meta">Published {new Date(article.published_at).toLocaleDateString('en-IN')}</div>}
      {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
      {article.cover_image_url && <img className="article-cover" src={article.cover_image_url} alt="" />}
      <div className="article-body">{article.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {article.tags.length > 0 && <div className="tags">{article.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>}
      <Link className="text-link" href="/articles">← Back to articles</Link>
    </main>
  );
}
