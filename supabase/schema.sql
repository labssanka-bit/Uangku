-- ============================================================================
-- UangKu — Skema Database Supabase (PostgreSQL)
-- ----------------------------------------------------------------------------
-- Jalankan seluruh file ini di Supabase Dashboard > SQL Editor.
-- Mencakup: tabel, Row Level Security (RLS), dan seed kategori default
-- otomatis untuk setiap user baru lewat trigger.
-- ============================================================================

-- Ekstensi untuk UUID
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- ENUM tipe transaksi
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'tx_type') then
    create type tx_type as enum ('income', 'expense');
  end if;
  if not exists (select 1 from pg_type where typname = 'recurrence_freq') then
    create type recurrence_freq as enum ('daily', 'weekly', 'monthly', 'yearly');
  end if;
end $$;

-- ============================================================================
-- 1. PROFILES — data profil tiap user (1:1 dengan auth.users)
-- ============================================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  currency    text not null default 'IDR',
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- 2. CATEGORIES — kategori pemasukan/pengeluaran (default + custom)
-- ============================================================================
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  icon        text not null default 'tag',     -- nama ikon lucide-react
  color       text not null default '#6366f1', -- warna pastel hex
  type        tx_type not null,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories (user_id);

-- ============================================================================
-- 3. TRANSACTIONS — catatan transaksi
-- ============================================================================
create table if not exists public.transactions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  amount       numeric(15, 2) not null check (amount >= 0),
  type         tx_type not null,
  note         text,
  date         date not null default current_date,
  is_recurring boolean not null default false,
  created_at   timestamptz not null default now()
);
create index if not exists transactions_user_date_idx on public.transactions (user_id, date desc);
create index if not exists transactions_category_idx on public.transactions (category_id);

-- ============================================================================
-- 4. BUDGETS — anggaran per kategori per bulan
-- ============================================================================
create table if not exists public.budgets (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid not null references public.categories (id) on delete cascade,
  amount       numeric(15, 2) not null check (amount >= 0),
  month        int not null check (month between 1 and 12),
  year         int not null check (year between 2000 and 2100),
  created_at   timestamptz not null default now(),
  unique (user_id, category_id, month, year)
);
create index if not exists budgets_user_period_idx on public.budgets (user_id, year, month);

-- ============================================================================
-- 5. RECURRING_TRANSACTIONS — transaksi berulang (gaji, langganan, tagihan)
-- ============================================================================
create table if not exists public.recurring_transactions (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  amount       numeric(15, 2) not null check (amount >= 0),
  type         tx_type not null,
  note         text,
  frequency    recurrence_freq not null default 'monthly',
  next_date    date not null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);
create index if not exists recurring_user_idx on public.recurring_transactions (user_id, next_date);

-- ============================================================================
-- ROW LEVEL SECURITY — tiap user hanya bisa akses datanya sendiri
-- ============================================================================
alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.transactions           enable row level security;
alter table public.budgets                enable row level security;
alter table public.recurring_transactions enable row level security;

-- PROFILES
drop policy if exists "profil sendiri - select" on public.profiles;
create policy "profil sendiri - select" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profil sendiri - update" on public.profiles;
create policy "profil sendiri - update" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "profil sendiri - insert" on public.profiles;
create policy "profil sendiri - insert" on public.profiles
  for insert with check (auth.uid() = id);

-- Helper: policy generik "data milik user" untuk tabel lain
-- (di-apply manual per tabel agar eksplisit)

-- CATEGORIES
drop policy if exists "kategori milik user" on public.categories;
create policy "kategori milik user" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TRANSACTIONS
drop policy if exists "transaksi milik user" on public.transactions;
create policy "transaksi milik user" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- BUDGETS
drop policy if exists "anggaran milik user" on public.budgets;
create policy "anggaran milik user" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RECURRING
drop policy if exists "berulang milik user" on public.recurring_transactions;
create policy "berulang milik user" on public.recurring_transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- SEED OTOMATIS — buat profil + kategori default saat user baru daftar
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Buat profil
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  -- Kategori PEMASUKAN default
  insert into public.categories (user_id, name, icon, color, type, is_default) values
    (new.id, 'Gaji',        'wallet',        '#10b981', 'income',  true),
    (new.id, 'Bonus',       'gift',          '#34d399', 'income',  true),
    (new.id, 'Investasi',   'trending-up',   '#06b6d4', 'income',  true),
    (new.id, 'Lainnya',     'circle-plus',   '#22c55e', 'income',  true);

  -- Kategori PENGELUARAN default
  insert into public.categories (user_id, name, icon, color, type, is_default) values
    (new.id, 'Makanan',     'utensils',      '#f97316', 'expense', true),
    (new.id, 'Transport',   'car',           '#3b82f6', 'expense', true),
    (new.id, 'Belanja',     'shopping-bag',  '#ec4899', 'expense', true),
    (new.id, 'Rumah',       'home',          '#8b5cf6', 'expense', true),
    (new.id, 'Tagihan',     'receipt',       '#ef4444', 'expense', true),
    (new.id, 'Hiburan',     'gamepad-2',     '#a855f7', 'expense', true),
    (new.id, 'Kesehatan',   'heart-pulse',   '#14b8a6', 'expense', true),
    (new.id, 'Pendidikan',  'graduation-cap','#6366f1', 'expense', true),
    (new.id, 'Lainnya',     'tag',           '#64748b', 'expense', true);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Selesai. Setelah ini, daftar user baru lewat aplikasi → profil & kategori
-- default otomatis terbuat.
-- ============================================================================
