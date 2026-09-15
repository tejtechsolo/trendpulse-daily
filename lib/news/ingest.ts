import { createHash } from 'node:crypto';
import type { NewsItem } from './collector';
import { normalizeTitle } from './dedupe';
import { classifyRisk, scoreTopic } from './risk';
import { createAdminClient } from '@/lib/supabase/admin';

function contentHash(item: NewsItem) {
  return createHash('sha256').update(`${item.url}|${normalizeTitle(item.title)}`).digest('hex');
}

export async function ingestNews(items: NewsItem[]) {
  const supabase = createAdminClient();
  const rows = items.map((item) => ({
    source_name: item.source,
    source_url: item.url,
    title: item.title,
    normalized_title: normalizeTitle(item.title),
    description: item.description,
    category: item.category,
    published_at: item.publishedAt,
    status: 'new' as const,
    risk_level: classifyRisk(item.title, item.description ?? ''),
    topic_score: scoreTopic(item.title, item.description ?? '', item.category),
    content_hash: contentHash(item),
    raw_payload: item,
  }));

  if (!rows.length) return { inserted: 0 };

  const { data, error } = await supabase
    .from('news_items')
    .upsert(rows, { onConflict: 'content_hash', ignoreDuplicates: true })
    .select('id');

  if (error) throw error;
  return { inserted: data?.length ?? 0 };
}
