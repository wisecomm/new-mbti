create table public.mbti_results (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  submission_id  uuid not null,
  method         text not null check (method in ('questionnaire')),
  method_version text not null,
  -- Positive leans to the axis's first letter (E, S, T, J).
  ei smallint not null check (ei between -100 and 100),
  sn smallint not null check (sn between -100 and 100),
  tf smallint not null check (tf between -100 and 100),
  jp smallint not null check (jp between -100 and 100),
  -- The only place the score-to-letters rule lives.
  type text generated always as (
    (case when ei >= 0 then 'E' else 'I' end) ||
    (case when sn >= 0 then 'S' else 'N' end) ||
    (case when tf >= 0 then 'T' else 'F' end) ||
    (case when jp >= 0 then 'J' else 'P' end)
  ) stored,
  created_at timestamptz not null default now(),
  unique (user_id, submission_id)
);

create index mbti_results_user_created_idx on public.mbti_results (user_id, created_at desc);

alter table public.mbti_results enable row level security;

create policy "read own results" on public.mbti_results for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "insert own results" on public.mbti_results for insert to authenticated
  with check ((select auth.uid()) = user_id);
-- No update/delete policies: results are immutable history.

revoke all on public.mbti_results from anon, authenticated;
grant select, insert on public.mbti_results to authenticated;
