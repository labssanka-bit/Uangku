-- ============================================================================
-- Migrasi Tier 1 — jalankan di Supabase SQL Editor (setelah schema.sql)
-- Menambah kolom saldo awal di profiles. Aman dijalankan berulang.
-- ============================================================================

alter table public.profiles
  add column if not exists opening_balance numeric(15, 2) not null default 0;

-- Selesai. Fitur lain Tier 1 (auto-post berulang, quick-add, insight banding)
-- murni di sisi aplikasi, tidak butuh perubahan database.
