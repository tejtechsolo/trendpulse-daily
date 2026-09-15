import { getPublishedArticles } from '@/lib/articles';

export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const articles = await getPublishedArticles();
  const items = articles.map((article) => `<item><title><![CDATA[${article.title}]]></title><link>${base}/articles/${article.slug}</link><guid>${base}/articles/${article.slug}</guid><description><![CDATA[${article.excerpt ?? ''}]]></description><pubDate>${new Date(article.published_at!).toUTCString()}</pubDate></item>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>TrendPulse Daily</title><link>${base}</link><description>AI, technology, business, India and world current affairs.</description>${items}</channel></rss>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
