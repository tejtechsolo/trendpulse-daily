import { NextResponse } from 'next/server';
import { getStoredGoogleAuth } from '@/lib/google-auth';
import { getBlogger } from '@/lib/google';
import { getCurrentUser } from '@/lib/rbac';

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const isCron = Boolean(expected && supplied === expected);
  let userId: string | null = null;
  if (isCron) userId = process.env.GOOGLE_CONNECTION_USER_ID ?? null;
  else userId = (await getCurrentUser()).user?.id ?? null;
  if (!userId) return NextResponse.json({ error: 'Unauthorized or Google connection owner is not configured' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.content) return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  if (!process.env.GOOGLE_BLOGGER_ID) return NextResponse.json({ error: 'GOOGLE_BLOGGER_ID is not configured' }, { status: 500 });

  try {
    const { client } = await getStoredGoogleAuth(userId);
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
