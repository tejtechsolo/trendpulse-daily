export type NewsSource = {
  name: string;
  url: string;
  category: string;
  trusted: boolean;
};

export const NEWS_SOURCES: NewsSource[] = [
  { name: 'Google News AI', url: 'https://news.google.com/rss/search?q=artificial+intelligence', category: 'ai', trusted: true },
  { name: 'Google News Technology', url: 'https://news.google.com/rss/search?q=technology', category: 'technology', trusted: true },
  { name: 'Google News Business', url: 'https://news.google.com/rss/search?q=business', category: 'business', trusted: true },
  { name: 'Google News India', url: 'https://news.google.com/rss/search?q=India', category: 'india', trusted: true },
  { name: 'Google News World', url: 'https://news.google.com/rss/search?q=world', category: 'world', trusted: true },
];
