-- Flash Learn: security-first schema to apply only after taking a full production database backup.
-- This SQL is intentionally NOT executed by Vercel. Use Supabase CLI migration new,
-- review this file against actual production schema, then deploy to the authorized project.
-- IMPORTANT: legacy ownerless records cannot automatically be attributed to users.
-- They remain in the legacy table for a controlled consent-based recovery process.
begin;
-- Immediately deny public access to ownerless legacy study history.
alter table if exists public.study_sessions enable row level security;
drop policy if exists "Anyone can view sessions" on public.study_sessions;
drop policy if exists "Anyone can insert sessions" on public.study_sessions;
drop policy if exists "Anyone can update sessions" on public.study_sessions;
drop policy if exists "Anyone can delete sessions" on public.study_sessions;
revoke all on table public.study_sessions from anon, authenticated;
create table if not exists public.private_study_sessions (
 id uuid primary key,
 user_id uuid not null references auth.users (id) on delete cascade,
 title text not null check (length(title) between 1 and 500),
 payload jsonb not null check (jsonb_typeof(payload) = 'object'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists private_study_sessions_owner_created
 on public.private_study_sessions (user_id, created_at desc);
alter table public.private_study_sessions enable row level security;
revoke all on table public.private_study_sessions from anon, public;
grant select, insert, update, delete on public.private_study_sessions to authenticated;
drop policy if exists "Own private study sessions read" on public.private_study_sessions;
drop policy if exists "Own private study sessions insert" on public.private_study_sessions;
drop policy if exists "Own private study sessions update" on public.private_study_sessions;
drop policy if exists "Own private study sessions delete" on public.private_study_sessions;
create policy "Own private study sessions read" on public.private_study_sessions
 for select to authenticated using ((select auth.uid()) = user_id);
create policy "Own private study sessions insert" on public.private_study_sessions
 for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Own private study sessions update" on public.private_study_sessions
 for update to authenticated using ((select auth.uid()) = user_id)
 with check ((select auth.uid()) = user_id);
create policy "Own private study sessions delete" on public.private_study_sessions
 for delete to authenticated using ((select auth.uid()) = user_id);
-- AI usage: deny anonymous and client-side direct quota edits.
create table if not exists public.student_ai_daily_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null,
  used integer not null default 0 check (used >= 0),
  primary key(user_id,usage_date)
);
alter table public.student_ai_daily_usage enable row level security;
revoke all on table public.student_ai_daily_usage from anon,authenticated,public;
-- Authenticated users can claim an allowance through this narrow RPC only.
-- SECURITY DEFINER is intentionally constrained: auth.uid() is mandatory,
-- the quota is hardcoded, no arbitrary owner parameter exists, and search_path is empty.
create or replace function public.claim_student_ai_credit()
returns boolean language plpgsql security definer set search_path = ''
as $
declare
  caller uuid := auth.uid();
  claimed integer;
begin
  if caller is null then return false; end if;
  insert into public.student_ai_daily_usage (user_id,usage_date,used)
    values (caller,current_date,1)
  on conflict (user_id,usage_date)
    do update set used = public.student_ai_daily_usage.used + 1
      where public.student_ai_daily_usage.used < 5
  returning used into claimed;
  return claimed is not null;
end;
$;
revoke all on function public.claim_student_ai_credit() from PUBLIC, anon;
grant execute on function public.claim_student_ai_credit() to authenticated;
commit;
-- Post-deployment verification must test anon SELECT/INSERT rejection, two independent
-- users reading/writing each other's IDs, self CRUD, backup restore, and no legacy loss.
