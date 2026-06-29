-- ============================================================================
-- Chat Support + Admin role. Jalankan di Supabase SQL Editor. Idempotent.
-- ============================================================================

-- Tandai admin
alter table public.profiles add column if not exists is_admin boolean not null default false;

create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

-- Admin boleh baca semua profil (utk daftar percakapan)
drop policy if exists "admin baca semua profil" on public.profiles;
create policy "admin baca semua profil" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- Pesan support (1 percakapan per user)
create table if not exists public.support_messages (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  sender     text not null check (sender in ('user','admin')),
  body       text not null,
  read_admin boolean not null default false,
  read_user  boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists support_user_idx on public.support_messages (user_id, created_at);

alter table public.support_messages enable row level security;

drop policy if exists "baca pesan sendiri / admin" on public.support_messages;
create policy "baca pesan sendiri / admin" on public.support_messages
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "kirim pesan" on public.support_messages;
create policy "kirim pesan" on public.support_messages
  for insert with check (
    (user_id = auth.uid() and sender = 'user') or (public.is_admin() and sender = 'admin')
  );

drop policy if exists "tandai dibaca" on public.support_messages;
create policy "tandai dibaca" on public.support_messages
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Realtime (abaikan error bila sudah ada)
do $$ begin
  alter publication supabase_realtime add table public.support_messages;
exception when others then null; end $$;
