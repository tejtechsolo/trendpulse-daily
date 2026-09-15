create type public.content_opportunity_status as enum ('new', 'reviewed', 'dismissed', 'converted');

create table public.content_opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  normalized_title text not null,
  category text not null,
  source_type text not null default 'news',
  source_url text,
  source_news_item_id uuid references public.news_items(id) on delete set null,
  opportunity_score integer not null default 0 check (opportunity_score between 0 and 100),
  trend_score integer not null default 0 check (trend_score between 0 and 100),
  topic_score integer not null default 0 check (topic_score between 0 and 100),
  rationale text,
  suggested_keywords text[] not null default '{}',
  status public.content_opportunity_status not null default 'new',
  converted_article_id uuid references public.articles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index content_opportunities_title_key
  on public.content_opportunities(normalized_title);
create index content_opportunities_score_idx
  on public.content_opportunities(status, opportunity_score desc, created_at desc);
create index content_opportunities_category_idx
  on public.content_opportunities(category, created_at desc);

create trigger content_opportunities_set_updated_at
before update on public.content_opportunities
for each row execute function public.set_updated_at();

alter table public.content_opportunities enable row level security;

create policy "Reviewers can read content opportunities"
on public.content_opportunities for select
to authenticated
using (public.has_permission('articles.review'));

create policy "Reviewers can manage content opportunities"
on public.content_opportunities for all
to authenticated
using (public.has_permission('articles.review'))
with check (public.has_permission('articles.review'));

comment on table public.content_opportunities is 'Topic and trend opportunities generated from collected news/trend signals for editorial planning.';
