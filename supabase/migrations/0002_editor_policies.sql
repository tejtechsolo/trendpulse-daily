-- Milestone 4: authenticated editorial CRUD.
-- Application-level RBAC will be tightened in a later migration.

create policy "Authenticated editors can insert articles"
on public.articles for insert
to authenticated
with check (true);

create policy "Authenticated editors can update articles"
on public.articles for update
to authenticated
using (true)
with check (true);

create policy "Authenticated editors can delete articles"
on public.articles for delete
to authenticated
using (true);

create policy "Authenticated editors can manage categories"
on public.categories for all
to authenticated
using (true)
with check (true);

create policy "Authenticated editors can manage sources"
on public.sources for all
to authenticated
using (true)
with check (true);
