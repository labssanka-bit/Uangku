# UangKu — Catatan Keuangan Pribadi 💸

Aplikasi web pencatatan keuangan pribadi yang modern, bersih, dan mobile-first.
Dibuat untuk masyarakat Indonesia: seluruh antarmuka Bahasa Indonesia, format
Rupiah (Rp 212.048.000), dan tanggal lokal (Sen, 25 Mei 2026).

## ✨ Fitur

- **Dashboard** — kartu saldo gradient + privacy mode, ringkasan pemasukan/pengeluaran, insight cerdas otomatis (uang aman harian, kategori dominan), menu cepat, ringkasan anggaran, transaksi terakhir.
- **Transaksi** — list dikelompokkan per hari + total harian, pencarian, filter (Semua/Pengeluaran/Pemasukan), tap untuk edit/hapus.
- **Tambah/Edit** — bottom sheet dengan keypad angka custom, grid kategori, opsi transaksi berulang.
- **Statistik** — kartu pemasukan/pengeluaran, metrik (rata-rata/hari, transaksi terbesar, rasio nabung), arus kas bersih, tren 6 bulan (bar), tren per kategori (line, filter harian/mingguan/bulanan).
- **Anggaran** — limit per kategori per bulan dengan progress bar berwarna (hijau→kuning→merah).
- **Transaksi Berulang** — gaji, langganan, tagihan.
- **Kategori custom** — tambah/edit dengan pemilih ikon & warna.
- **Setting** — profil, mata uang, ekspor CSV, reset data, dark mode, logout.
- **Dark mode** & **privacy mode** (sembunyikan semua angka dengan satu tap).
- **Auto-post berulang** — transaksi berulang yang jatuh tempo otomatis dibuat saat app dibuka (tanpa server/cron).
- **Catat Cepat (quick-add)** — chip 1-tap di Dashboard dari transaksi yang paling sering kamu catat.
- **Saldo Awal** — set saldo saat ini sekali di Setting → Total Saldo langsung akurat tanpa input histori lama.
- **Insight banding bulan lalu** — "Pengeluaran naik/turun X% dari bulan lalu".

## 🧱 Tech Stack

| Bagian | Teknologi |
|---|---|
| Frontend | React 18 + Vite + TypeScript |
| Styling | Tailwind CSS (dark mode `class`) |
| Data fetching | TanStack React Query |
| UI state | Zustand (+ persist) |
| Grafik | Recharts |
| Ikon | lucide-react |
| Animasi | Framer Motion |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Tanggal | date-fns (locale `id`) |

## 📁 Struktur Proyek

```
personal-finance/
├─ supabase/schema.sql        # tabel, RLS, seed kategori default (trigger)
├─ src/
│  ├─ lib/                    # supabase, format Rupiah/tanggal, insight, export CSV, ikon
│  ├─ types/                  # tipe domain (Transaction, Category, dst.)
│  ├─ store/                  # uiStore (dark, privacy, bulan aktif)
│  ├─ hooks/                  # useAuth, useTransactions, useCategories, useBudgets, ...
│  ├─ components/
│  │  ├─ ui/                  # Card, Amount, Sheet, Numpad, ProgressBar, CategoryIcon
│  │  ├─ layout/              # BottomNav, PageHeader, ThemeToggles
│  │  ├─ TransactionItem.tsx
│  │  └─ TransactionSheet.tsx # tambah/edit transaksi
│  ├─ pages/                  # Dashboard, Transactions, Statistics, Budget, Recurring, Categories, Settings, Login
│  ├─ App.tsx                 # routing + layout + dark mode
│  └─ main.tsx                # providers
└─ .env.example
```

## 🚀 Cara Menjalankan

### 1. Install dependensi

```bash
npm install
```

### 2. Siapkan Supabase

1. Buat proyek baru di [supabase.com](https://supabase.com).
2. Buka **SQL Editor** → tempel seluruh isi [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   Ini membuat semua tabel, Row Level Security, dan trigger yang otomatis
   membuat profil + kategori default saat ada user baru mendaftar.
3. Buka **Project Settings → API**, salin **Project URL** dan **anon public key**.
4. (Update Tier 1) Jalankan juga [`supabase/migrations/2026_tier1.sql`](supabase/migrations/2026_tier1.sql)
   untuk menambah kolom **saldo awal**. Aman dijalankan berulang.

### 3. Konfigurasi environment

```bash
cp .env.example .env
```

Isi `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

> ⚠️ Untuk uji cepat tanpa verifikasi email, matikan **Confirm email** di
> Supabase → Authentication → Providers → Email.

### 4. Jalankan

```bash
npm run dev
```

Buka http://localhost:5173 → **Daftar** akun baru → kategori default langsung tersedia.

## 🗄️ Skema Database

5 tabel utama, semua dilindungi RLS (tiap user hanya melihat datanya sendiri):

- `profiles` — profil user (1:1 dengan `auth.users`)
- `categories` — kategori income/expense (default + custom)
- `transactions` — catatan transaksi
- `budgets` — anggaran per kategori per bulan
- `recurring_transactions` — transaksi berulang

Kategori default yang otomatis dibuat: **Gaji, Bonus, Investasi, Lainnya**
(pemasukan); **Makanan, Transport, Belanja, Rumah, Tagihan, Hiburan, Kesehatan,
Pendidikan, Lainnya** (pengeluaran).

## 📝 Catatan Pengembangan

- **Materialisasi transaksi berulang**: tabel `recurring_transactions` menyimpan
  jadwal. Untuk benar-benar otomatis membuat transaksi pada `next_date`,
  tambahkan [Supabase Scheduled Function / pg_cron](https://supabase.com/docs/guides/functions/schedule-functions)
  yang menyalin recurring jatuh tempo ke tabel `transactions` lalu memajukan `next_date`.
- Format Rupiah & tanggal ada di [`src/lib/format.ts`](src/lib/format.ts).
- Insight otomatis dihitung di [`src/lib/summary.ts`](src/lib/summary.ts).

## 📦 Build Produksi

```bash
npm run build
npm run preview
```

---

Dibuat dengan ❤️ untuk mempermudah mencatat keuangan sehari-hari.
