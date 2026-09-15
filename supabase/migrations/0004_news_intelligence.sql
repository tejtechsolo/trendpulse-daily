create type public.news_item_status as enum ('new', 'processing', 'ready_for_review', 'approved', 'rejected', 'converted');

create table public.news_items (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  source_url text not null,
  title text not null,
  normalized_title text not null,
  description text,
  category text not null,
  published_at timestamptz,
  status public.news_item_status not null default 'new',
  risk_level public.article_risk_level not null default 'medium',
  topic_score integer not null default 0 check (topic_score between 0 and 100),
  content_hash text not null,
  raw_payload jsonb,
  article_id uuid references public.articles(id) on delete set null,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index news_items_content_hash_key on public.news_items(content_hash);
create index news_items_status_idx on public.news_items(status, created_at desc);
create index news_items_category_idx on public.news_items(category, published_at desc);

create trigger news_items_set_updated_at
before update on public.news_items
for each row execute function public.set_updated_at();

alter table public.news_items enable row level security;

create policy "Authenticated users can read news queue"
on public.news_items for select
to authenticated
using (true);

create policy "Reviewers can update news queue"
on public.news_items for update
to authenticated
using (public.has_permission('articles.review'))
with check (public.has_permission('articles.review'));

comment on table public.news_items is 'Raw collected news stories and automation processing state; ingestion writes use the service role.';
