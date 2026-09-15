import { NEWS_SOURCES } from './sources';

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  category: string;
  publishedAt: string | null;
  description: string | null;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? stripHtml(match[1]) : null;
}

export async function collectNews(limitPerSource = 10): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(async (source) => {
      const response = await fetch(source.url, { next: { revalidate: 300 } });
      if (!response.ok) throw new Error(`Failed to fetch ${source.name}: ${response.status}`);
      const xml = await response.text();
      const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

      return items.slice(0, limitPerSource).map((item) => ({
        title: tag(item, 'title') ?? 'Untitled',
        url: tag(item, 'link') ?? '',
        source: source.name,
        category: source.category,
        publishedAt: tag(item, 'pubDate'),
        description: tag(item, 'description'),
      })).filter((item) => item.url);
    }),
  );

  return results.flatMap((result) => result.status === 'fulfilled' ? result.value : []);
}
