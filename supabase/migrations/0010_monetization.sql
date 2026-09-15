create table if not exists public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('adsense', 'affiliate', 'sponsorship', 'newsletter', 'other')),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  currency text not null default 'INR',
  reference text,
  notes text,
  event_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists revenue_events_date_idx on public.revenue_events(event_date desc);
create index if not exists revenue_events_source_idx on public.revenue_events(source, event_date desc);

alter table public.revenue_events enable row level security;

create policy "Admins can read revenue events"
on public.revenue_events for select
to authenticated
using (public.has_permission('categories.manage'));

create policy "Admins can manage revenue events"
on public.revenue_events for all
to authenticated
using (public.has_permission('categories.manage'))
with check (public.has_permission('categories.manage'));

comment on table public.revenue_events is 'Manual/verified monetization records for reporting; no payment credentials are stored.';
