import type { MetadataRoute } from 'next';
import { getPublishedArticles } from '@/lib/articles';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const articles = await getPublishedArticles();
  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/articles`, changeFrequency: 'hourly', priority: 0.9 },
    ...articles.map((article) => ({ url: `${base}/articles/${article.slug}`, lastModified: article.updated_at, changeFrequency: 'daily' as const, priority: 0.8 })),
  ];
}
