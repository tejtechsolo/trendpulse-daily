create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "Authenticated admins can read site settings"
on public.site_settings for select
to authenticated
using (public.has_permission('categories.manage'));

create policy "Authenticated admins can manage site settings"
on public.site_settings for all
to authenticated
using (public.has_permission('categories.manage'))
with check (public.has_permission('categories.manage'));

insert into public.site_settings(key, value)
values
  ('site_name', 'TrendPulse Daily'),
  ('automation_enabled', 'false')
on conflict (key) do nothing;
