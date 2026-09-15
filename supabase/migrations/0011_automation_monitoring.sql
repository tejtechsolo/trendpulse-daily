create type public.automation_run_status as enum ('running', 'success', 'failed');

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status public.automation_run_status not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  duration_ms integer,
  processed_count integer not null default 0,
  success_count integer not null default 0,
  failed_count integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists automation_runs_job_idx on public.automation_runs(job_name, started_at desc);
create index if not exists automation_runs_status_idx on public.automation_runs(status, started_at desc);

alter table public.automation_runs enable row level security;

create policy "Reviewers can read automation runs"
on public.automation_runs for select
to authenticated
using (public.has_permission('articles.review'));

comment on table public.automation_runs is 'Operational history for scheduled news collection, AI processing and publishing jobs.';
