import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type ProfileWithRole = {
  id: string;
  display_name: string | null;
  role_id: string | null;
  roles: { name: string; description: string | null } | null;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function getCurrentProfile() {
  const { supabase, user } = await getCurrentUser();
  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name, role_id, roles(name, description)')
    .eq('id', user.id)
    .maybeSingle();

  return { supabase, user, profile: profile as ProfileWithRole | null };
}

export async function hasPermission(permission: string) {
  const { supabase, user } = await getCurrentUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc('has_permission', { permission_key: permission });
  return !error && data === true;
}

export async function requireUser() {
  const result = await getCurrentProfile();
  if (!result.user) redirect('/admin/login');
  return result;
}

export async function requirePermission(permission: string) {
  const result = await requireUser();
  const allowed = await result.supabase.rpc('has_permission', { permission_key: permission });
  if (allowed.error || allowed.data !== true) redirect('/admin');
  return result;
}

export async function requireRole(role: string) {
  const result = await requireUser();
  if (result.profile?.roles?.name !== role) redirect('/admin');
  return result;
}
