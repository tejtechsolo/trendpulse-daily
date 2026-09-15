create type public.article_event_type as enum ('page_view', 'share', 'outbound_click');

create table if not exists public.article_events (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  event_type public.article_event_type not null default 'page_view',
  referrer text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists article_events_article_idx on public.article_events(article_id, created_at desc);
create index if not exists article_events_created_idx on public.article_events(created_at desc);

alter table public.article_events enable row level security;

create policy "Admins can read article analytics"
on public.article_events for select
 to authenticated
 using (public.has_permission('categories.manage'));

comment on table public.article_events is 'Privacy-conscious first-party article events. No IP address or raw user-agent is stored.';
