-- Milestone 5: database-backed RBAC.
-- Run after 0001_initial_schema.sql and 0002_editor_policies.sql.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role_id uuid references public.roles(id) on delete set null,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_profiles_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_profiles_updated_at();

insert into public.roles (name, description, is_system) values
  ('admin', 'Full system administration and publishing access', true),
  ('editor', 'Editorial creation and publishing workflow access', true),
  ('author', 'Create and edit assigned editorial content', true),
  ('reviewer', 'Review and approve or reject content', true)
on conflict (name) do nothing;

insert into public.permissions (key, description) values
  ('articles.create', 'Create articles'),
  ('articles.edit', 'Edit articles'),
  ('articles.delete', 'Delete articles'),
  ('articles.review', 'Review, approve and reject articles'),
  ('articles.publish', 'Publish articles'),
  ('articles.submit_review', 'Submit articles for review'),
  ('categories.manage', 'Manage categories'),
  ('sources.manage', 'Manage sources'),
  ('users.manage', 'Manage user roles and profiles'),
  ('roles.manage', 'Manage roles and permissions')
on conflict (key) do nothing;

-- Admin gets every permission.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.name = 'admin'
on conflict do nothing;

-- Editor: editorial workflow, but no user/role administration.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.key in
('articles.create','articles.edit','articles.delete','articles.review','articles.publish','articles.submit_review','categories.manage','sources.manage')
where r.name = 'editor'
on conflict do nothing;

-- Author: create/edit/submit; cannot publish or review.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.key in
('articles.create','articles.edit','articles.submit_review')
where r.name = 'author'
on conflict do nothing;

-- Reviewer: review workflow only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.key in
('articles.review')
where r.name = 'reviewer'
on conflict do nothing;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role_id = pr.role_id
    join public.permissions p on p.id = rp.permission_id
    where pr.id = auth.uid() and p.key = permission_key
  );
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;

create policy "Authenticated users can read roles"
on public.roles for select to authenticated using (true);
create policy "Authenticated users can read permissions"
on public.permissions for select to authenticated using (true);
create policy "Authenticated users can read role permissions"
on public.role_permissions for select to authenticated using (true);
create policy "Users can read own profile"
on public.profiles for select to authenticated using (id = auth.uid() or public.has_permission('users.manage'));
create policy "Admins can insert profiles"
on public.profiles for insert to authenticated with check (public.has_permission('users.manage'));
create policy "Admins can update profiles"
on public.profiles for update to authenticated using (public.has_permission('users.manage')) with check (public.has_permission('users.manage'));
create policy "Admins can delete profiles"
on public.profiles for delete to authenticated using (public.has_permission('users.manage'));
create policy "Role managers can manage roles"
on public.roles for all to authenticated using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));
create policy "Role managers can manage role permissions"
on public.role_permissions for all to authenticated using (public.has_permission('roles.manage')) with check (public.has_permission('roles.manage'));

-- Remove Milestone 4's broad authenticated policies.
drop policy if exists "Authenticated editors can insert articles" on public.articles;
drop policy if exists "Authenticated editors can update articles" on public.articles;
drop policy if exists "Authenticated editors can delete articles" on public.articles;
drop policy if exists "Authenticated editors can manage categories" on public.categories;
drop policy if exists "Authenticated editors can manage sources" on public.sources;

create policy "Permissioned users can insert articles"
on public.articles for insert to authenticated
with check (public.has_permission('articles.create'));

create policy "Permissioned users can update articles"
on public.articles for update to authenticated
using (public.has_permission('articles.edit') or (author_id = auth.uid() and public.has_permission('articles.create')))
with check (public.has_permission('articles.edit') or (author_id = auth.uid() and public.has_permission('articles.create')));

create policy "Permissioned users can delete articles"
on public.articles for delete to authenticated
using (public.has_permission('articles.delete'));

create policy "Permissioned users can manage categories"
on public.categories for all to authenticated
using (public.has_permission('categories.manage'))
with check (public.has_permission('categories.manage'));

create policy "Permissioned users can manage sources"
on public.sources for all to authenticated
using (public.has_permission('sources.manage'))
with check (public.has_permission('sources.manage'));

-- Bootstrap the first admin by replacing AUTH_USER_UUID with the UUID from
-- Supabase Authentication > Users, then running this statement manually:
-- insert into public.profiles (id, role_id)
-- select 'AUTH_USER_UUID', id from public.roles where name = 'admin';
