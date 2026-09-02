-- Scenario inputs are retained as planning evidence, never as operational instructions.
alter table public.scenarios
  add column if not exists created_by uuid references auth.users(id),
  add column if not exists scenario_description text;

create policy "authenticated demo users may save scenarios" on public.scenarios
  for insert to authenticated with check (auth.uid() = created_by);
