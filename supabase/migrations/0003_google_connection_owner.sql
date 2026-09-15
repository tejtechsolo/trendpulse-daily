alter table public.google_connections add column if not exists user_id uuid references auth.users(id) on delete cascade;
create index if not exists google_connections_user_id_idx on public.google_connections(user_id);
