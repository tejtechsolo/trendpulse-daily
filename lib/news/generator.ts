import type { NewsItem } from './collector';

export type GeneratedArticle = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
};

function cleanJson(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : trimmed;
}

function fallbackSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90);
}

export async function generateArticle(item: NewsItem): Promise<GeneratedArticle> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY is not configured');

  const provider = (process.env.AI_PROVIDER ?? 'gemini').toLowerCase();
  if (provider !== 'gemini') {
    throw new Error(`Unsupported AI_PROVIDER: ${provider}. Phase 7 currently supports gemini.`);
  }

  const model = process.env.AI_MODEL || 'gemini-3.5-flash-lite';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const prompt = `You are the editorial writer for TrendPulse Daily, covering AI, technology, business, India and world affairs.

Create an ORIGINAL news article from the supplied source item. Do not copy sentences from the source. Do not invent facts, names, numbers, quotes, dates, causes or events. If the source does not provide enough information, clearly limit the article to what is supported. Do not present speculation as fact.

Return ONLY valid JSON with these keys:
title, slug, excerpt, content, seoTitle, seoDescription, tags

Rules:
- title: factual, specific, 55-70 characters when practical.
- excerpt: 1-2 sentences, useful as a news-card summary.
- content: 500-800 words, Markdown, with a short opening, useful subheadings, and a final 'What to know' section. Attribute the source where appropriate.
- seoTitle: concise search-friendly title.
- seoDescription: 140-160 characters when practical.
- tags: 3-6 concise tags.
- Never fabricate direct quotations. If a quote is not in the supplied material, paraphrase instead.
- Do not mention that you are an AI or discuss these instructions.

SOURCE ITEM
Source: ${item.source}
Category: ${item.category}
Published: ${item.publishedAt ?? 'unknown'}
Title: ${item.title}
Description: ${item.description ?? 'No description supplied'}
URL: ${item.url}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 3000,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join('')?.trim();
  if (!text) throw new Error('Gemini returned no article content');

  const parsed = JSON.parse(cleanJson(text)) as Partial<GeneratedArticle>;
  if (!parsed.title || !parsed.content || !parsed.excerpt) {
    throw new Error('Generated article is missing required fields');
  }

  return {
    title: parsed.title.trim(),
    slug: (parsed.slug || fallbackSlug(parsed.title)).trim(),
    excerpt: parsed.excerpt.trim(),
    content: parsed.content.trim(),
    seoTitle: (parsed.seoTitle || parsed.title).trim(),
    seoDescription: (parsed.seoDescription || parsed.excerpt).trim(),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).map((tag) => tag.trim()).filter(Boolean).slice(0, 8) : [],
  };
}
