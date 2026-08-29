-- FutureCrest CRM: Web Push subscriptions
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions(user_id);

-- RLS for client safety. Server APIs use service role after auth checks,
-- same pattern as the rest of this app (see GROUP_CHAT_MIGRATION.sql).
alter table public.push_subscriptions enable row level security;

drop policy if exists users_can_view_own_subscriptions on public.push_subscriptions;
create policy users_can_view_own_subscriptions on public.push_subscriptions for select using (
  user_id = auth.uid()
);

drop policy if exists users_can_insert_own_subscriptions on public.push_subscriptions;
create policy users_can_insert_own_subscriptions on public.push_subscriptions for insert with check (
  user_id = auth.uid()
);

drop policy if exists users_can_delete_own_subscriptions on public.push_subscriptions;
create policy users_can_delete_own_subscriptions on public.push_subscriptions for delete using (
  user_id = auth.uid()
);

-- No explicit service-role policy is needed: the service_role key used by
-- server API routes (adminSupabase) bypasses RLS entirely, which is how
-- lib/push.ts reads every subscription row when sending a push.
