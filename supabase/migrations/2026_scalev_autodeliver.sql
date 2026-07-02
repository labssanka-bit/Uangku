-- ============================================================================
-- Auto-delivery kode saat order Scalev lunas (webhook → Edge Function).
-- Reserve 1 kode unused TANPA meng-consume (uses tak naik) supaya pembeli
-- tetap bisa memakainya saat daftar. Idempotent.
-- ============================================================================

alter table public.license_keys add column if not exists reserved_email text;
alter table public.license_keys add column if not exists reserved_at    timestamptz;

-- Ambil 1 kode "available" berikutnya secara atomik & tandai reserved.
-- available = belum habis kuota (uses < max_uses) DAN belum di-reserve.
-- FOR UPDATE SKIP LOCKED → aman dari race (2 order bersamaan dpt kode beda).
create or replace function public.claim_next_license(p_email text)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  -- Idempotensi: kalau email ini sudah pernah dapat kode, kembalikan yg sama.
  select code into v_code from public.license_keys
   where reserved_email = lower(p_email) order by reserved_at asc limit 1;
  if v_code is not null then return v_code; end if;

  select code into v_code from public.license_keys
   where uses < max_uses and reserved_email is null
   order by created_at asc
   for update skip locked
   limit 1;

  if v_code is null then return null; end if;  -- stok kode habis

  update public.license_keys
     set reserved_email = lower(p_email), reserved_at = now()
   where code = v_code;

  return v_code;
end $$;

revoke all on function public.claim_next_license(text) from public, anon, authenticated;
