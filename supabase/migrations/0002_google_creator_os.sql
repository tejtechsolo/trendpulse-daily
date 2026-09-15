create table if not exists public.google_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google',
  email text,
  google_subject text,
  refresh_token_encrypted text not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, google_subject)
);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  status text not null default 'idea' check (status in ('idea','researching','draft','review','approved','published','rejected')),
  excerpt text,
  body_markdown text,
  seo_title text,
  seo_description text,
  keywords text[] not null default '{}',
  source_urls text[] not null default '{}',
  blogger_post_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_events (
  id bigint generated always as identity primary key,
  content_id uuid references public.content_items(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.google_connections enable row level security;
alter table public.content_items enable row level security;
alter table public.content_events enable row level security;

create index if not exists content_items_status_idx on public.content_items(status);
create index if not exists content_items_published_at_idx on public.content_items(published_at desc);
create index if not exists content_events_content_id_idx on public.content_events(content_id);
