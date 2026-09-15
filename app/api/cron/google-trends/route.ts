import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { collectGoogleTrends } from '@/lib/news/google-trends';
import { opportunityKey, keywordSuggestions } from '@/lib/news/opportunities';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

function categoryFor(title: string) {
  const value = title.toLowerCase();
  if (/\b(ai|artificial intelligence|chatgpt|gemini|openai|robot|machine learning)\b/.test(value)) return 'ai';
  if (/\b(tech|technology|iphone|android|google|microsoft|apple|software)\b/.test(value)) return 'technology';
  if (/\b(stock|market|business|company|bank|economy|ipo)\b/.test(value)) return 'business';
  if (/\b(india|indian|delhi|mumbai|bengaluru|hyderabad)\b/.test(value)) return 'india';
  return 'world';
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const trends = await collectGoogleTrends();
    const supabase = createAdminClient();
    let upserted = 0;
    for (const trend of trends.slice(0, 50)) {
      const category = categoryFor(trend.title);
      const traffic = Number.parseInt((trend.traffic ?? '0').replace(/[^0-9]/g, ''), 10) || 0;
      const trendScore = Math.min(100, 40 + Math.round(Math.log10(Math.max(10, traffic)) * 10));
      const { error } = await supabase.from('content_opportunities').upsert({
        title: trend.title,
        normalized_title: opportunityKey(trend.title),
        category,
        source_type: 'google_trends',
        source_url: process.env.GOOGLE_TRENDS_RSS_URL || 'https://trends.google.com/trending/rss?geo=IN',
        opportunity_score: trendScore,
        trend_score: trendScore,
        topic_score: trendScore,
        rationale: `Google Trends signal${trend.traffic ? ` with approximate traffic ${trend.traffic}` : ''}. Validate the trend and source facts before publishing.`,
        suggested_keywords: keywordSuggestions(trend.title),
        metadata: { traffic: trend.traffic, published_at: trend.publishedAt },
      }, { onConflict: 'normalized_title', ignoreDuplicates: false });
      if (!error) upserted++;
    }
    return NextResponse.json({ ok: true, collected: trends.length, upserted });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Google Trends collection failed' }, { status: 500 });
  }
}
