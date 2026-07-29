-- Pengumuman / update in-app (dibuat admin, dibaca semua user).
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
-- Semua user login boleh baca pengumuman aktif; tulis hanya via service role (Edge Function admin).
drop policy if exists "baca pengumuman aktif" on public.announcements;
create policy "baca pengumuman aktif" on public.announcements for select
  to authenticated using (active = true);
create index if not exists idx_ann_created on public.announcements(created_at desc);
