alter table public.articles
  add column if not exists quality_score integer check (quality_score between 0 and 100),
  add column if not exists quality_checks jsonb not null default '{}'::jsonb,
  add column if not exists source_verified boolean not null default false,
  add column if not exists review_notes text;

create index if not exists articles_quality_idx on public.articles(status, quality_score desc);

comment on column public.articles.quality_checks is 'Deterministic editorial checks run before publication.';
comment on column public.articles.source_verified is 'Explicit human confirmation that the article was checked against its source material.';
