import { createClient } from '@/lib/supabase/server';

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  category_id: string | null;
  status: string;
  risk_level: string;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  published_at: string | null;
  scheduled_for: string | null;
  rejection_reason: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  categories?: { name: string; slug: string } | null;
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export async function getPublishedArticles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,content,cover_image_url,category_id,status,risk_level,seo_title,seo_description,tags,published_at,scheduled_for,rejection_reason,view_count,created_at,updated_at,categories(name,slug)')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((article) => ({
    ...article,
    categories: Array.isArray(article.categories)
      ? article.categories[0] ?? null
      : article.categories ?? null,
  })) as Article[];
}

export async function getPublishedArticle(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('articles')
    .select('id,title,slug,excerpt,content,cover_image_url,category_id,status,risk_level,seo_title,seo_description,tags,published_at,scheduled_for,rejection_reason,view_count,created_at,updated_at,categories(name,slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return {
    ...data,
    categories: Array.isArray(data.categories)
      ? data.categories[0] ?? null
      : data.categories ?? null,
  } as Article;
}

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('categories').select('id,name,slug').order('name');
  if (error) throw new Error(error.message);
  return data ?? [];
}
