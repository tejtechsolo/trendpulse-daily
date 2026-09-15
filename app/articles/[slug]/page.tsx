import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedArticle } from '@/lib/articles';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) return { title: 'Article not found | TrendPulse Daily' };
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = `${base}/articles/${article.slug}`;
  const title = article.seo_title || article.title;
  const description = article.seo_description || article.excerpt || undefined;
  return {
    title, description, keywords: article.tags,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title, description, publishedTime: article.published_at ?? undefined, images: article.cover_image_url ? [article.cover_image_url] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: article.cover_image_url ? [article.cover_image_url] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedArticle(slug);
  if (!article) notFound();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const url = `${base}/articles/${article.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'NewsArticle', mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    headline: article.title, description: article.excerpt || article.seo_description || undefined,
    datePublished: article.published_at, dateModified: article.updated_at,
    image: article.cover_image_url ? [article.cover_image_url] : undefined,
    author: { '@type': 'Organization', name: process.env.NEXT_PUBLIC_SITE_NAME || 'TrendPulse Daily' },
    publisher: { '@type': 'Organization', name: process.env.NEXT_PUBLIC_SITE_NAME || 'TrendPulse Daily' },
  };
  return <main className="section container article-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="eyebrow">{article.categories?.name ?? 'News'}</div>
    <h1 className="page-title">{article.title}</h1>
    {article.published_at && <div className="meta">Published {new Date(article.published_at).toLocaleDateString('en-IN')}</div>}
    {article.excerpt && <p className="article-excerpt">{article.excerpt}</p>}
    {article.cover_image_url && <img className="article-cover" src={article.cover_image_url} alt="" />}
    <div className="article-body">{article.content.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
    {article.tags.length > 0 && <div className="tags">{article.tags.map((tag) => <span className="tag" key={tag}>#{tag}</span>)}</div>}
    <Link className="text-link" href="/articles">← Back to articles</Link>
  </main>;
}
