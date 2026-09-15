import { normalizeTitle } from './dedupe';

const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'after', 'before', 'into', 'about', 'over', 'will', 'has', 'have']);

export function keywordSuggestions(title: string, description = '') {
  const words = `${title} ${description}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word));

  return [...new Set(words)].slice(0, 8);
}

export function opportunityScore(input: {
  title: string;
  category: string;
  topicScore: number;
  publishedAt?: string | null;
}) {
  const ageHours = input.publishedAt
    ? Math.max(0, (Date.now() - new Date(input.publishedAt).getTime()) / 36e5)
    : 48;
  const freshness = Math.max(0, Math.round(30 - Math.min(ageHours, 30)));
  const categoryBoost = ['ai', 'technology', 'business', 'india', 'world'].includes(input.category) ? 10 : 0;
  const titleBoost = /\b(update|launch|launches|announces|announcement|breaking|new|latest|report|decision)\b/i.test(input.title) ? 15 : 0;
  return Math.min(100, Math.max(0, Math.round(input.topicScore * 0.45 + freshness + categoryBoost + titleBoost)));
}

export function opportunityRationale(score: number, title: string) {
  if (score >= 80) return `High-priority fresh topic: ${title}`;
  if (score >= 60) return `Good editorial opportunity with current-news relevance: ${title}`;
  return `Monitor this topic for additional developments: ${title}`;
}

export function opportunityKey(title: string) {
  return normalizeTitle(title);
}
