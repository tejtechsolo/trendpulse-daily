create extension if not exists "pgcrypto";

create type public.article_status as enum ('draft', 'pending_review', 'scheduled', 'published', 'rejected', 'archived');
create type public.article_risk_level as enum ('low', 'medium', 'high');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null unique,
  source_type text not null default 'website',
  is_trusted boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null default '',
  cover_image_url text,
  category_id uuid references public.categories(id) on delete set null,
  source_id uuid references public.sources(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  status public.article_status not null default 'draft',
  risk_level public.article_risk_level not null default 'low',
  seo_title text,
  seo_description text,
  tags text[] not null default '{}',
  published_at timestamptz,
  scheduled_for timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  view_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index articles_status_idx on public.articles(status);
create index articles_published_at_idx on public.articles(published_at desc);
create index articles_category_id_idx on public.articles(category_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
before update on public.articles
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.sources enable row level security;
alter table public.articles enable row level security;

create policy "Public can read categories"
on public.categories for select using (true);

create policy "Public can read trusted sources"
on public.sources for select using (is_trusted = true);

create policy "Public can read published articles"
on public.articles for select
using (status = 'published' and published_at is not null and published_at <= now());

insert into public.categories (name, slug, description) values
  ('Artificial Intelligence', 'ai', 'AI tools, models, research, and industry updates'),
  ('Technology', 'technology', 'Software, hardware, startups, and digital trends'),
  ('Business', 'business', 'Markets, companies, finance, and entrepreneurship'),
  ('India', 'india', 'Important developments across India'),
  ('World', 'world', 'International news and global affairs')
on conflict (slug) do nothing;
