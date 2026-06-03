-- ============================================================================
-- UangKu — Migrasi Batch 3 (Gemini receipt parsing)
-- Tambah rincian item & merchant pada transaksi.
-- Jalankan di Supabase SQL Editor. Idempotent.
-- ============================================================================

alter table public.transactions
  add column if not exists merchant text,
  add column if not exists items jsonb; -- [{ name, qty, price }]

-- Selesai. Parsing struk dilakukan Edge Function 'parse-receipt' (Gemini).
