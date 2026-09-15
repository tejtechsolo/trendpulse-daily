export type TrendItem = {
  title: string;
  traffic: string | null;
  publishedAt: string | null;
};

function decode(value: string) {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function tag(xml: string, name: string) {
  const match = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i'));
  return match ? decode(match[1]) : null;
}

export async function collectGoogleTrends(): Promise<TrendItem[]> {
  const url = process.env.GOOGLE_TRENDS_RSS_URL || 'https://trends.google.com/trending/rss?geo=IN';
  const response = await fetch(url, { next: { revalidate: 900 }, headers: { 'User-Agent': 'TrendPulseDaily/1.0' } });
  if (!response.ok) throw new Error(`Google Trends RSS returned ${response.status}`);

  const xml = await response.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items.map((item) => ({
    title: tag(item, 'title') ?? '',
    traffic: tag(item, 'ht:approx_traffic'),
    publishedAt: tag(item, 'pubDate'),
  })).filter((item) => item.title);
}
