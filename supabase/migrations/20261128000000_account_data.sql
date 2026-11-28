create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  bio text not null default '',
  wallet_address text,
  updated_at timestamptz not null default now()
);

create table if not exists public.drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default '',
  summary text not null default '',
  topic text not null default '',
  tags text[] not null default '{}',
  "references" text[] not null default '{}',
  content text not null default '',
  article_slug text,
  saved_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.drafts
  add column if not exists "references" text[] not null default '{}',
  add column if not exists article_slug text;

create table if not exists public.bookmarks (
  user_id uuid not null references auth.users (id) on delete cascade,
  article_slug text not null,
  saved_at timestamptz not null default now(),
  primary key (user_id, article_slug)
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  updated_at timestamptz not null default now()
);

create index if not exists drafts_user_updated_at_idx
  on public.drafts (user_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.drafts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.user_preferences enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own on public.profiles
  for delete to authenticated using ((select auth.uid()) = id);

drop policy if exists drafts_select_own on public.drafts;
create policy drafts_select_own on public.drafts
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists drafts_insert_own on public.drafts;
create policy drafts_insert_own on public.drafts
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists drafts_update_own on public.drafts;
create policy drafts_update_own on public.drafts
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists drafts_delete_own on public.drafts;
create policy drafts_delete_own on public.drafts
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists bookmarks_select_own on public.bookmarks;
create policy bookmarks_select_own on public.bookmarks
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists bookmarks_insert_own on public.bookmarks;
create policy bookmarks_insert_own on public.bookmarks
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists bookmarks_update_own on public.bookmarks;
create policy bookmarks_update_own on public.bookmarks
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists bookmarks_delete_own on public.bookmarks;
create policy bookmarks_delete_own on public.bookmarks
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists user_preferences_select_own on public.user_preferences;
create policy user_preferences_select_own on public.user_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists user_preferences_insert_own on public.user_preferences;
create policy user_preferences_insert_own on public.user_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists user_preferences_update_own on public.user_preferences;
create policy user_preferences_update_own on public.user_preferences
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists user_preferences_delete_own on public.user_preferences;
create policy user_preferences_delete_own on public.user_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.profiles, public.drafts, public.bookmarks, public.user_preferences from public, anon, authenticated;
grant select, insert, update, delete on public.profiles, public.drafts, public.bookmarks, public.user_preferences to authenticated;

grant usage on schema public to authenticated;

insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(
    nullif(btrim(users.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(users.email, ''), '@', 1), ''),
    'Reader'
  )
from auth.users as users
on conflict (id) do nothing;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Reader'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();
