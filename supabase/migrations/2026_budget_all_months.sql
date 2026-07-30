-- Fix: anggaran "berlaku semua bulan" pakai sentinel month=0, year=0.
-- CHECK lama (month 1..12, year 2000..2100) menolak sentinel → Simpan gagal.
-- Longgarkan agar 0 diterima (0 = template semua-bulan).

alter table public.budgets drop constraint if exists budgets_month_check;
alter table public.budgets add  constraint budgets_month_check check (month between 0 and 12);

alter table public.budgets drop constraint if exists budgets_year_check;
alter table public.budgets add  constraint budgets_year_check check (year = 0 or year between 2000 and 2100);
