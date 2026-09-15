import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/rbac';
import { createGoogleState } from '@/lib/google-state';
import { googleAuthorizationUrl } from '@/lib/google';

export async function GET(request: Request) {
  const { user } = await requireUser();
  if (!process.env.GOOGLE_REDIRECT_URI) return NextResponse.json({ error: 'Set GOOGLE_REDIRECT_URI before connecting Google.' }, { status: 500 });

  const state = createGoogleState();
  const cookieStore = await cookies();
  const options = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' as const, path: '/', maxAge: 600 };
  cookieStore.set('google_oauth_state', state, options);
  cookieStore.set('google_oauth_user', user!.id, options);

  return NextResponse.redirect(googleAuthorizationUrl(state));
}
