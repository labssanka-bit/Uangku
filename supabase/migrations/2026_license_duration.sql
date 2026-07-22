-- Masa aktif lisensi: lifetime (null) atau N bulan.
alter table public.license_keys add column if not exists duration_months int; -- null = lifetime
alter table public.profiles     add column if not exists access_until timestamptz; -- null = lifetime/selamanya
create index if not exists idx_profiles_access_until on public.profiles(access_until);
