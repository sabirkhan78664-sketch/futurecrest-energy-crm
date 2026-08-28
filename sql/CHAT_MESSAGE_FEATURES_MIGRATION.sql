-- FutureCrest CRM: message search/pin/read-receipt support
-- Run once in Supabase SQL Editor AFTER GROUP_CHAT_MIGRATION.sql.

alter table public.crm_messages
  add column if not exists is_pinned boolean not null default false;

alter table public.crm_messages
  add column if not exists edited_at timestamptz;

alter table public.crm_messages
  add column if not exists read_by jsonb not null default '[]'::jsonb;

create index if not exists crm_messages_pinned_idx
  on public.crm_messages(is_pinned) where is_pinned = true;

create index if not exists crm_messages_created_at_idx
  on public.crm_messages(created_at);
