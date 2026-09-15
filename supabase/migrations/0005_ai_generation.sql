alter table public.news_items
  add column if not exists ai_model text,
  add column if not exists generated_at timestamptz,
  add column if not exists generated_payload jsonb;

create index if not exists news_items_ready_review_idx
  on public.news_items(status, risk_level, topic_score desc, created_at desc);

comment on column public.news_items.generated_payload is 'Structured AI generation result retained for editorial traceability.';
