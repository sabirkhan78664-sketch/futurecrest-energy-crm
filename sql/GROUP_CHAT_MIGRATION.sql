-- FutureCrest CRM Group Chat
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.crm_chat_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_chat_group_members (
  group_id uuid not null references public.crm_chat_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id,user_id)
);

alter table public.crm_messages add column if not exists group_id uuid references public.crm_chat_groups(id) on delete cascade;
create index if not exists crm_messages_group_id_idx on public.crm_messages(group_id);
create index if not exists crm_chat_group_members_user_idx on public.crm_chat_group_members(user_id);

-- Optional RLS for client safety. Server APIs use service role after role checks.
alter table public.crm_chat_groups enable row level security;
alter table public.crm_chat_group_members enable row level security;

drop policy if exists group_members_can_view_groups on public.crm_chat_groups;
create policy group_members_can_view_groups on public.crm_chat_groups for select using (
  exists (select 1 from public.crm_chat_group_members m where m.group_id=id and m.user_id=auth.uid())
);

drop policy if exists members_can_view_memberships on public.crm_chat_group_members;
create policy members_can_view_memberships on public.crm_chat_group_members for select using (
  user_id=auth.uid() or exists (select 1 from public.crm_chat_group_members mine where mine.group_id=group_id and mine.user_id=auth.uid())
);
