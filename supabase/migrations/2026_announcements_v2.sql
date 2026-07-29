-- Jenis & target pengumuman.
alter table public.announcements add column if not exists type text not null default 'info';   -- info | promo | maintenance
alter table public.announcements add column if not exists target text not null default 'all';   -- all | monthly | lifetime
