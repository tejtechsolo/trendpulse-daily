import { NextResponse } from 'next/server';
import { getStoredGoogleAuth } from '@/lib/google-auth';
import { getBlogger } from '@/lib/google';
import { requireUser } from '@/lib/rbac';

export async function POST(request: Request) {
  const { user } = await requireUser();
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!expected || supplied !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.content) return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  if (!process.env.GOOGLE_BLOGGER_ID) return NextResponse.json({ error: 'GOOGLE_BLOGGER_ID is not configured' }, { status: 500 });

  try {
    const { client } = await getStoredGoogleAuth(user!.id);
    const blogger = getBlogger(client);
    const response = await blogger.posts.insert({
      blogId: process.env.GOOGLE_BLOGGER_ID,
      isDraft: body.isDraft !== false,
      requestBody: { title: body.title, content: body.content, labels: Array.isArray(body.labels) ? body.labels : undefined }
    });
    return NextResponse.json({ id: response.data.id, url: response.data.url, status: body.isDraft !== false ? 'draft' : 'published' });
  } catch (err) {
    console.error('Blogger publish failed', err);
    return NextResponse.json({ error: 'Blogger publishing failed' }, { status: 500 });
  }
}
