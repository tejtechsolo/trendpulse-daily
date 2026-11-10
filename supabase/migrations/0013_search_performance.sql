create table public.search_performance (
  id uuid primary key default gen_random_uuid(),
  report_date date not null,
  dimension_key text not null,
  dimensions jsonb not null default '{}'::jsonb,
  query_text text,
  page_url text,
  country text,
  device text,
  clicks integer not null default 0 check (clicks >= 0),
  impressions integer not null default 0 check (impressions >= 0),
  ctr numeric(8,6) not null default 0 check (ctr >= 0 and ctr <= 1),
  average_position numeric(10,3) not null default 0 check (average_position >= 0),
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (report_date, dimension_key)
);

create index search_performance_date_idx on public.search_performance(report_date desc);
create index search_performance_query_idx on public.search_performance(query_text, report_date desc);
create index search_performance_page_idx on public.search_performance(page_url, report_date desc);

alter table public.search_performance enable row level security;

create policy "SEO managers can read search performance"
on public.search_performance for select
to authenticated
using (public.has_permission('categories.manage'));

comment on table public.search_performance is 'Daily Google Search Console performance rows grouped by date, query, page, country and device. Written by the server-side cron using the service role.';
