-- Kategori bisa disembunyikan (alternatif aman dari hapus).
-- Kategori tersembunyi: tidak muncul di pemilih transaksi & daftar anggaran,
-- tapi riwayat transaksi lama tetap memakai labelnya (tidak ada data hilang).

alter table public.categories
  add column if not exists hidden boolean not null default false;

create index if not exists categories_user_hidden_idx
  on public.categories (user_id, hidden);
