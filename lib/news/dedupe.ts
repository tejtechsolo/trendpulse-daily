import type { NewsItem } from './collector';

export function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function dedupeNews(items: NewsItem[]) {
  const seenTitles = new Set<string>();
  const seenUrls = new Set<string>();

  return items.filter((item) => {
    const title = normalizeTitle(item.title);
    if (!title || seenTitles.has(title) || seenUrls.has(item.url)) return false;
    seenTitles.add(title);
    seenUrls.add(item.url);
    return true;
  });
}
