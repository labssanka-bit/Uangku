-- ============================================================================
-- Panel admin: status aktif pengguna (last_seen) + statistik kuota DB.
-- Sekalian tutup celah: user bisa set is_admin sendiri (policy UPDATE CHECK null).
-- Idempotent.
-- ============================================================================

-- ── 1) last_seen: kapan terakhir pengguna aktif ──────────────────────────────
alter table public.profiles add column if not exists last_seen timestamptz;

-- Client panggil rpc ini berkala (SECURITY DEFINER → tak perlu update tabel
-- langsung, jadi tak menyentuh kolom sensitif seperti is_admin).
create or replace function public.touch_last_seen()
returns void language sql security definer set search_path = public as $$
  update public.profiles set last_seen = now() where id = auth.uid();
$$;
revoke all on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;

-- ── 2) Cegah eskalasi hak: user tak boleh mengubah is_admin sendiri ─────────
-- Policy UPDATE lama (USING auth.uid()=id, WITH CHECK null) mengizinkan user
-- mengubah kolom apa pun di baris sendiri, termasuk is_admin. Trigger ini
-- mengembalikan is_admin ke nilai lama kecuali dipanggil role privileged
-- (service_role dari Edge Function admin, atau postgres/supabase_admin).
-- CATATAN: JANGAN pakai SECURITY DEFINER di sini. Trigger harus jalan sebagai
-- role pemanggil supaya current_user = 'authenticated' saat user biasa update
-- (kalau definer, current_user = pemilik fungsi/postgres → guard ke-bypass).
create or replace function public.guard_profile_admin()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.is_admin is distinct from old.is_admin
     and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    new.is_admin := old.is_admin;
  end if;
  return new;
end $$;

drop trigger if exists trg_guard_profile_admin on public.profiles;
create trigger trg_guard_profile_admin
  before update on public.profiles
  for each row execute function public.guard_profile_admin();

-- ── 3) Statistik kuota DB (khusus service role / Edge Function admin) ─────────
create or replace function public.admin_usage_stats()
returns json language sql security definer set search_path = public as $$
  select json_build_object(
    'db_bytes', pg_database_size(current_database()),
    'tables', (
      select coalesce(json_agg(json_build_object(
        'name', relname,
        'bytes', pg_total_relation_size(c.oid)
      ) order by pg_total_relation_size(c.oid) desc), '[]'::json)
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    ),
    'tx_total', (select count(*) from public.transactions),
    'tx_bytes', pg_total_relation_size('public.transactions'::regclass),
    'tx_by_user', (
      select coalesce(json_agg(json_build_object('user_id', user_id, 'n', cnt)), '[]'::json)
      from (select user_id, count(*) cnt from public.transactions group by user_id) t
    )
  );
$$;
revoke all on function public.admin_usage_stats() from public, anon, authenticated;
