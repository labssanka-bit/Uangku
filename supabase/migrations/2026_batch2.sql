-- ============================================================================
-- UangKu — Migrasi Batch 2
-- Dompet 2-tingkat, Hutang-Piutang, Aset, kolom struk di transaksi.
-- Jalankan di Supabase SQL Editor (setelah schema.sql & 2026_tier1.sql).
-- Aman dijalankan berulang (idempotent).
-- ============================================================================

-- ENUM baru
do $$
begin
  if not exists (select 1 from pg_type where typname = 'wallet_group') then
    create type wallet_group as enum ('cashflow', 'saving');
  end if;
  if not exists (select 1 from pg_type where typname = 'debt_type') then
    create type debt_type as enum ('hutang', 'piutang'); -- hutang=aku pinjam, piutang=aku beri pinjam
  end if;
  if not exists (select 1 from pg_type where typname = 'debt_status') then
    create type debt_status as enum ('belum', 'lunas');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- WALLETS — dompet/rekening custom dalam grup Cashflow / Saving
-- ----------------------------------------------------------------------------
create table if not exists public.wallets (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  "group"         wallet_group not null default 'cashflow',
  name            text not null,
  icon            text not null default 'wallet',
  color           text not null default '#72283A',
  opening_balance numeric(15, 2) not null default 0,
  is_default      boolean not null default false,
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists wallets_user_idx on public.wallets (user_id);

-- ----------------------------------------------------------------------------
-- TRANSACTIONS — tambah kolom dompet & struk
-- ----------------------------------------------------------------------------
alter table public.transactions
  add column if not exists wallet_id uuid references public.wallets (id) on delete set null,
  add column if not exists receipt_url text;
create index if not exists transactions_wallet_idx on public.transactions (wallet_id);

-- ----------------------------------------------------------------------------
-- DEBTS — hutang & piutang
-- ----------------------------------------------------------------------------
create table if not exists public.debts (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  person       text not null,
  amount       numeric(15, 2) not null check (amount >= 0),
  paid_amount  numeric(15, 2) not null default 0 check (paid_amount >= 0),
  type         debt_type not null,
  due_date     date,
  status       debt_status not null default 'belum',
  note         text,
  wallet_id    uuid references public.wallets (id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists debts_user_idx on public.debts (user_id);

-- ----------------------------------------------------------------------------
-- ASSETS — aset / emas / investasi
-- ----------------------------------------------------------------------------
create table if not exists public.assets (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  name           text not null,
  type           text not null default 'lainnya', -- emas | properti | saham | reksadana | lainnya
  quantity       numeric(15, 4) not null default 1,
  buy_price      numeric(15, 2) not null default 0,
  current_value  numeric(15, 2) not null default 0,
  date           date not null default current_date,
  note           text,
  created_at     timestamptz not null default now()
);
create index if not exists assets_user_idx on public.assets (user_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.wallets enable row level security;
alter table public.debts   enable row level security;
alter table public.assets  enable row level security;

drop policy if exists "dompet milik user" on public.wallets;
create policy "dompet milik user" on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "hutang milik user" on public.debts;
create policy "hutang milik user" on public.debts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "aset milik user" on public.assets;
create policy "aset milik user" on public.assets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- SEED dompet default untuk user yang BELUM punya dompet (backfill)
-- ============================================================================
insert into public.wallets (user_id, "group", name, icon, color, is_default, sort_order)
select u.id, v.grp::wallet_group, v.nm, v.ic, v.cl, v.def, v.so
from auth.users u
cross join (values
  ('cashflow', 'Cash',     'wallet',     '#72283A', true,  0),
  ('cashflow', 'Bank',     'landmark',   '#B05A72', false, 1),
  ('saving',   'Tabungan', 'piggy-bank', '#3E7A66', true,  2)
) as v(grp, nm, ic, cl, def, so)
where not exists (select 1 from public.wallets w where w.user_id = u.id);

-- ============================================================================
-- Update trigger handle_new_user: tambah dompet default untuk user BARU
-- (categories tetap sama seperti schema.sql; di sini hanya tambahkan wallets)
-- ============================================================================
create or replace function public.seed_default_wallets()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.wallets (user_id, "group", name, icon, color, is_default, sort_order) values
    (new.id, 'cashflow', 'Cash',     'wallet',     '#72283A', true,  0),
    (new.id, 'cashflow', 'Bank',     'landmark',   '#B05A72', false, 1),
    (new.id, 'saving',   'Tabungan', 'piggy-bank', '#3E7A66', true,  2);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_wallets on auth.users;
create trigger on_auth_user_created_wallets
  after insert on auth.users
  for each row execute function public.seed_default_wallets();

-- ============================================================================
-- STORAGE — bucket untuk foto struk (OCR)
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Policy: user hanya kelola file di folder miliknya (path diawali user_id/)
drop policy if exists "struk upload sendiri" on storage.objects;
create policy "struk upload sendiri" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "struk baca publik" on storage.objects;
create policy "struk baca publik" on storage.objects
  for select using (bucket_id = 'receipts');

drop policy if exists "struk hapus sendiri" on storage.objects;
create policy "struk hapus sendiri" on storage.objects
  for delete to authenticated
  using (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Selesai.
