-- ============================================================================
-- UangKu / Finplan Sanka — Lisensi (kode akses) untuk gating signup.
-- Hanya yang punya kode (dari pembelian) bisa membuat akun.
-- Jalankan di Supabase SQL Editor. Idempotent.
-- ============================================================================

create table if not exists public.license_keys (
  code         text primary key,
  max_uses     int not null default 1,   -- 1 = sekali pakai; set besar utk kode bersama
  uses         int not null default 0,
  note         text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);

-- Kunci total: tak ada policy → hanya service role / fungsi security-definer yang boleh akses
alter table public.license_keys enable row level security;

-- Klaim kode secara atomik (dipanggil Edge Function via service role)
create or replace function public.redeem_license(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare n int;
begin
  update public.license_keys
     set uses = uses + 1, last_used_at = now()
   where code = p_code and uses < max_uses;
  get diagnostics n = row_count;
  return n > 0;
end $$;

-- Kembalikan kuota bila pembuatan akun gagal
create or replace function public.release_license(p_code text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.license_keys set uses = greatest(uses - 1, 0) where code = p_code;
end $$;

revoke all on function public.redeem_license(text) from public, anon, authenticated;
revoke all on function public.release_license(text) from public, anon, authenticated;

-- ── Contoh generate kode (jalankan saat butuh stok kode baru) ──
-- insert into public.license_keys (code, note)
-- select 'FS-' || upper(substr(md5(random()::text),1,4)) || '-' || upper(substr(md5(random()::text),1,4)), 'batch1'
-- from generate_series(1,50);
