import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/admin';
import { decryptToken } from '@/lib/token-crypto';

export async function getStoredGoogleAuth(userId?: string) {
  if (!userId) throw new Error('Authenticated user is required');
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('google_connections')
    .select('*')
    .eq('provider', 'google')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('No Google account connected.');

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
  client.setCredentials({ refresh_token: decryptToken(data.refresh_token_encrypted) });
  return { client, connection: data };
}
