'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { slugify } from '@/lib/articles';
import { requirePermission } from '@/lib/rbac';

export async function createArticle(formData: FormData) {
  const { supabase, user } = await requirePermission('articles.create');
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  if (!title || !content) throw new Error('Title and content are required.');

  const rawSlug = String(formData.get('slug') || title);
  const slug = slugify(rawSlug);
  const categoryId = String(formData.get('category_id') || '') || null;
  const riskLevel = String(formData.get('risk_level') || 'low');
  const tags = String(formData.get('tags') || '').split(',').map((x) => x.trim()).filter(Boolean);

  const { data, error } = await supabase.from('articles').insert({
    title, slug,
    excerpt: String(formData.get('excerpt') || '').trim() || null,
    content, category_id: categoryId, risk_level: riskLevel,
    seo_title: String(formData.get('seo_title') || '').trim() || null,
    seo_description: String(formData.get('seo_description') || '').trim() || null,
    cover_image_url: String(formData.get('cover_image_url') || '').trim() || null,
    tags, status: 'draft', author_id: user!.id,
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
  if (status === 'published') await requirePermission('articles.publish');
  if (status === 'pending_review') await requirePermission('articles.submit_review');
  if (status === 'rejected') await requirePermission('articles.review');

  const updates = {
    title: String(formData.get('title') || '').trim(),
    slug: slugify(String(formData.get('slug') || formData.get('title') || '')),
    excerpt: String(formData.get('excerpt') || '').trim() || null,
    content: String(formData.get('content') || '').trim(),
    category_id: String(formData.get('category_id') || '') || null,
    risk_level: String(formData.get('risk_level') || 'low'),
    seo_title: String(formData.get('seo_title') || '').trim() || null,
    seo_description: String(formData.get('seo_description') || '').trim() || null,
    cover_image_url: String(formData.get('cover_image_url') || '').trim() || null,
    tags: String(formData.get('tags') || '').split(',').map((x) => x.trim()).filter(Boolean),
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from('articles').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles');
  revalidatePath('/articles');
  revalidatePath(`/articles/${updates.slug}`);
  redirect('/admin/articles');
}

export async function changeArticleStatus(formData: FormData) {
  const id = String(formData.get('id') || '');
  const status = String(formData.get('status') || 'draft');
  const allowed = ['draft', 'pending_review', 'published', 'rejected', 'archived', 'scheduled'];
  if (!id || !allowed.includes(status)) throw new Error('Invalid article status.');

  const permission = status === 'published' ? 'articles.publish' :
    status === 'pending_review' ? 'articles.submit_review' :
    status === 'rejected' ? 'articles.review' : 'articles.edit';
  const { supabase, user } = await requirePermission(permission);
  const rejectionReason = String(formData.get('rejection_reason') || '').trim() || null;
  const reviewed = ['published', 'rejected'].includes(status);

  const { error } = await supabase.from('articles').update({
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
    rejection_reason: status === 'rejected' ? rejectionReason : null,
    reviewed_at: reviewed ? new Date().toISOString() : null,
    reviewed_by: reviewed ? user!.id : null,
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/articles');
  revalidatePath('/admin/review');
  revalidatePath('/articles');
}
