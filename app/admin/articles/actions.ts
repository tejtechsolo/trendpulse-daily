'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { slugify } from '@/lib/articles';
import { requirePermission } from '@/lib/rbac';
import { evaluateArticleQuality, canPublishQuality } from '@/lib/news/quality';

function parseTags(value: FormDataEntryValue | null) {
  return String(value || '').split(',').map((x) => x.trim()).filter(Boolean);
}

async function getQuality(supabase: Awaited<ReturnType<typeof requirePermission>>['supabase'], id: string, input: Parameters<typeof evaluateArticleQuality>[0]) {
  const { data } = await supabase.from('articles').select('source_id').eq('id', id).maybeSingle();
  let sourceUrl: string | null = null;
  if (data?.source_id) {
    const { data: source } = await supabase.from('sources').select('url').eq('id', data.source_id).maybeSingle();
    sourceUrl = source?.url ?? null;
  }
  return evaluateArticleQuality({ ...input, sourceUrl });
}

export async function createArticle(formData: FormData) {
  const { supabase, user } = await requirePermission('articles.create');
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  if (!title || !content) throw new Error('Title and content are required.');
  const slug = slugify(String(formData.get('slug') || title));
  const categoryId = String(formData.get('category_id') || '') || null;
  const riskLevel = String(formData.get('risk_level') || 'low');
  const tags = parseTags(formData.get('tags'));
  const sourceVerified = formData.get('source_verified') === 'on';

  const { data, error } = await supabase.from('articles').insert({
    title, slug, excerpt: String(formData.get('excerpt') || '').trim() || null, content,
    category_id: categoryId, risk_level: riskLevel,
    seo_title: String(formData.get('seo_title') || '').trim() || null,
    seo_description: String(formData.get('seo_description') || '').trim() || null,
    cover_image_url: String(formData.get('cover_image_url') || '').trim() || null,
    tags, source_verified: sourceVerified,
    review_notes: String(formData.get('review_notes') || '').trim() || null,
    status: 'draft', author_id: user!.id,
  }).select('id').single();
  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles');
  redirect(`/admin/articles/${data.id}/edit`);
}

export async function updateArticle(formData: FormData) {
  const { supabase } = await requirePermission('articles.edit');
  const id = String(formData.get('id') || '');
  if (!id) throw new Error('Article ID is required.');
  const status = String(formData.get('status') || 'draft');
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const riskLevel = String(formData.get('risk_level') || 'low');
  const sourceVerified = formData.get('source_verified') === 'on';
  const tags = parseTags(formData.get('tags'));
  const seoTitle = String(formData.get('seo_title') || '').trim() || null;
  const seoDescription = String(formData.get('seo_description') || '').trim() || null;
  const excerpt = String(formData.get('excerpt') || '').trim() || null;
  const updates: Record<string, unknown> = {
    title, slug: slugify(String(formData.get('slug') || title)), excerpt, content,
    category_id: String(formData.get('category_id') || '') || null, risk_level: riskLevel,
    seo_title: seoTitle, seo_description: seoDescription,
    cover_image_url: String(formData.get('cover_image_url') || '').trim() || null,
    tags, source_verified: sourceVerified,
    review_notes: String(formData.get('review_notes') || '').trim() || null,
    status,
    scheduled_for: status === 'scheduled' ? String(formData.get('scheduled_for') || '') || null : null,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  if (status === 'published') {
    await requirePermission('articles.publish');
    const quality = await getQuality(supabase, id, { title, content, excerpt, seoTitle, seoDescription, tags, riskLevel, sourceVerified });
    if (!canPublishQuality(quality, riskLevel, sourceVerified)) throw new Error(`Publication blocked. Quality score ${quality.score}/100. Fix failed checks and verify the source.`);
    updates.quality_score = quality.score;
    updates.quality_checks = quality.checks;
  } else if (status === 'scheduled') {
    await requirePermission('articles.publish');
    const quality = await getQuality(supabase, id, { title, content, excerpt, seoTitle, seoDescription, tags, riskLevel, sourceVerified });
    if (quality.score < 80) throw new Error(`Scheduling blocked. Quality score ${quality.score}/100; minimum is 80.`);
    updates.quality_score = quality.score;
    updates.quality_checks = quality.checks;
  } else if (status === 'pending_review') await requirePermission('articles.submit_review');
  else if (status === 'rejected') await requirePermission('articles.review');

  const { error } = await supabase.from('articles').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles'); revalidatePath('/admin/review'); revalidatePath('/articles');
  revalidatePath(`/articles/${updates.slug}`); revalidatePath('/sitemap.xml');
  redirect('/admin/articles');
}

export async function changeArticleStatus(formData: FormData) {
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || 'draft');
  const allowed = ['draft', 'pending_review', 'published', 'rejected', 'archived', 'scheduled'];
  if (!id || !allowed.includes(status)) throw new Error('Invalid article status.');
  const permission = status === 'published' || status === 'scheduled' ? 'articles.publish' : status === 'pending_review' ? 'articles.submit_review' : status === 'rejected' ? 'articles.review' : 'articles.edit';
  const { supabase, user } = await requirePermission(permission);
  const { data: article, error: readError } = await supabase.from('articles').select('title,content,excerpt,seo_title,seo_description,tags,risk_level,source_verified').eq('id', id).maybeSingle();
  if (readError || !article) throw new Error('Article not found.');
  const sourceVerified = formData.get('source_verified') === 'on' || article.source_verified === true;
  const rejectionReason = String(formData.get('rejection_reason') || '').trim() || null;
  const scheduledFor = String(formData.get('scheduled_for') || '').trim() || null;
  let qualityFields: Record<string, unknown> = {};
  if (status === 'published' || status === 'scheduled') {
    const quality = await getQuality(supabase, id, { title: article.title, content: article.content, excerpt: article.excerpt, seoTitle: article.seo_title, seoDescription: article.seo_description, tags: article.tags ?? [], riskLevel: article.risk_level, sourceVerified });
    if (status === 'published' && !canPublishQuality(quality, article.risk_level, sourceVerified)) throw new Error(`Publication blocked. Quality score ${quality.score}/100. Verify the source and fix failed checks.`);
    if (status === 'scheduled' && quality.score < 80) throw new Error(`Scheduling blocked. Quality score ${quality.score}/100; minimum is 80.`);
    qualityFields = { quality_score: quality.score, quality_checks: quality.checks };
  }
  const reviewed = ['published', 'rejected'].includes(status);
  const { error } = await supabase.from('articles').update({
    status, ...qualityFields, source_verified: sourceVerified,
    scheduled_for: status === 'scheduled' ? scheduledFor : null,
    published_at: status === 'published' ? new Date().toISOString() : null,
    rejection_reason: status === 'rejected' ? rejectionReason : null,
    reviewed_at: reviewed ? new Date().toISOString() : null,
    reviewed_by: reviewed ? user!.id : null,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles'); revalidatePath('/admin/review'); revalidatePath('/articles'); revalidatePath('/sitemap.xml');
}
