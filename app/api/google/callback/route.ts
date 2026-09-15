import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeGoogleCode } from '@/lib/google';
import { verifyGoogleState } from '@/lib/google-state';
import { encryptToken } from '@/lib/token-crypto';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const cookieStore = await cookies();
  const savedState = cookieStore.get('google_oauth_state')?.value;
  const userId = cookieStore.get('google_oauth_user')?.value;
  cookieStore.delete('google_oauth_state');
  cookieStore.delete('google_oauth_user');

  if (error) return NextResponse.redirect(new URL('/admin/integrations?google=cancelled', request.url));
  if (!code || !state || !savedState || !userId || state !== savedState || !verifyGoogleState(state)) {
    return NextResponse.json({ error: 'Invalid Google OAuth state.' }, { status: 400 });
  }

  try {
    const { tokens, profile } = await exchangeGoogleCode(code);
    if (!profile.id || !tokens.refresh_token) throw new Error('Google account or refresh token unavailable.');

    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('google_connections').upsert({
      user_id: userId,
      provider: 'google',
      email: profile.email ?? null,
      google_subject: profile.id,
      refresh_token_encrypted: encryptToken(tokens.refresh_token),
      scopes: String(tokens.scope ?? '').split(' ').filter(Boolean),
      updated_at: new Date().toISOString()
    }, { onConflict: 'provider,google_subject' });

    if (dbError) throw dbError;
    return NextResponse.redirect(new URL('/admin/integrations?google=connected', request.url));
  } catch (err) {
    console.error('Google callback failed', err);
    return NextResponse.redirect(new URL('/admin/integrations?google=error', request.url));
  }
}
