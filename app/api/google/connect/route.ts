import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createGoogleState } from '@/lib/google-state';
import { googleAuthorizationUrl } from '@/lib/google';

export async function GET(request: Request) {
  const state = createGoogleState();
  const cookieStore = await cookies();
  cookieStore.set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600
  });

  const url = new URL('/api/google/callback', request.url);
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || url.toString();
  if (redirectUri !== process.env.GOOGLE_REDIRECT_URI) {
    return NextResponse.json({ error: 'Set GOOGLE_REDIRECT_URI before connecting Google.' }, { status: 500 });
  }

  return NextResponse.redirect(googleAuthorizationUrl(state));
}
