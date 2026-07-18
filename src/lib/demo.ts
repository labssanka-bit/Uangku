/**
 * Mode DEMO — calon pembeli bisa coba app tanpa login.
 * Aktif via URL ?demo=1 (disimpan di sessionStorage). Semua data = contoh
 * statis; aksi simpan diblok (ajak daftar). Tidak menyentuh Supabase.
 */
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, Category, Wallet, Transaction, Debt, Asset, Budget } from '@/types'

const FLAG = 'fp_demo'

export function isDemo(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(FLAG) === '1'
}
export function enterDemo() {
  sessionStorage.setItem(FLAG, '1')
}
export function exitDemo() {
  sessionStorage.removeItem(FLAG)
}

/** Cek URL ?demo=1 saat load → set flag. Dipanggil sekali di main. */
export function initDemoFromUrl() {
  if (typeof window === 'undefined') return
  const p = new URLSearchParams(window.location.search)
  if (p.get('demo') === '1') enterDemo()
}

export const CHECKOUT_URL = 'https://digital-store-27.myscalev.com/landing-page-baru-8'

/** Blok aksi simpan saat demo + arahkan beli akses (bukan daftar gratis). */
export function demoBlock() {
  if (typeof window !== 'undefined') {
    const ok = confirm(
      '🔒 Ini cuma MODE DEMO untuk coba fitur.\n\n' +
      'Datamu di sini TIDAK akan tersimpan. Untuk mulai catat keuanganmu sendiri & disimpan beneran, kamu perlu akses Finplan Sanka.\n\n' +
      'Buka halaman beli akses sekarang?'
    )
    if (ok) window.open(CHECKOUT_URL, '_blank')
  }
  return true
}

// ── Fake auth ───────────────────────────────────────────────────────────────
const NOW = new Date().toISOString()
export const DEMO_USER = {
  id: 'demo-user', email: 'demo@finplansanka.com', aud: 'authenticated',
  role: 'authenticated', app_metadata: {}, user_metadata: { full_name: 'Sanka' },
  created_at: NOW,
} as unknown as User
export const DEMO_SESSION = {
  access_token: 'demo', refresh_token: 'demo', expires_in: 3600,
  token_type: 'bearer', user: DEMO_USER,
} as unknown as Session

// ── Seed data ────────────────────────────────────────────────────────────────
export const DEMO_PROFILE: Profile = {
  id: 'demo-user', full_name: 'Sanka', currency: 'IDR', opening_balance: 0, created_at: NOW,
  spending_reasons: ['Kebutuhan', 'Impulsif', 'Self-reward', 'Sosial', 'Darurat', 'Langganan'],
}

const C = (id: string, name: string, icon: string, color: string, type: 'income' | 'expense'): Category =>
  ({ id, user_id: 'demo-user', name, icon, color, type, is_default: true, created_at: NOW })

export const DEMO_CATEGORIES: Category[] = [
  C('c-gaji', 'Gaji', 'briefcase', '#3E7A66', 'income'),
  C('c-bonus', 'Bonus', 'gift', '#4E9079', 'income'),
  C('c-invest', 'Investasi', 'trending-up', '#0D9488', 'income'),
  C('c-lain-i', 'Lainnya', 'tag', '#64748b', 'income'),
  C('c-makan', 'Makanan', 'utensils', '#C04A5E', 'expense'),
  C('c-transport', 'Transport', 'car', '#8A3447', 'expense'),
  C('c-belanja', 'Belanja', 'shopping-bag', '#B05A72', 'expense'),
  C('c-rumah', 'Rumah', 'home', '#A14559', 'expense'),
  C('c-tagihan', 'Tagihan', 'receipt', '#8E3043', 'expense'),
  C('c-hiburan', 'Hiburan', 'gamepad-2', '#C57489', 'expense'),
  C('c-sehat', 'Kesehatan', 'heart-pulse', '#A93B50', 'expense'),
  C('c-lain-e', 'Lainnya', 'tag', '#64748b', 'expense'),
]
const cat = (id: string) => DEMO_CATEGORIES.find((c) => c.id === id) ?? null

const W = (id: string, group: 'cashflow' | 'saving', name: string, icon: string, color: string, opening: number, def: boolean, order: number): Wallet =>
  ({ id, user_id: 'demo-user', group, name, icon, color, opening_balance: opening, is_default: def, sort_order: order, created_at: NOW })

export const DEMO_WALLETS: Wallet[] = [
  W('w-cash', 'cashflow', 'Cash', 'wallet', '#72283A', 1500000, true, 0),
  W('w-bca', 'cashflow', 'BCA', 'landmark', '#B05A72', 6800000, false, 1),
  W('w-tab', 'saving', 'Tabungan', 'piggy-bank', '#3E7A66', 7000000, true, 2),
]
const wal = (id: string) => DEMO_WALLETS.find((w) => w.id === id) ?? null

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

let _tid = 0
const T = (daysAgo: number, type: 'income' | 'expense', amount: number, catId: string, walletId: string, note: string): Transaction => {
  _tid++
  return {
    id: `t-${_tid}`, user_id: 'demo-user', category_id: catId, amount, type,
    note, date: iso(daysAgo), is_recurring: false, wallet_id: walletId,
    receipt_url: null, merchant: null, items: null, created_at: NOW,
    category: cat(catId), wallet: wal(walletId),
  }
}

// ~6 bulan transaksi contoh (hari ini ... 165 hari lalu)
export const DEMO_TRANSACTIONS: Transaction[] = [
  // bulan ini
  T(1, 'income', 8500000, 'c-gaji', 'w-bca', 'Gaji bulanan'),
  T(1, 'expense', 35000, 'c-makan', 'w-cash', 'Kopi & roti'),
  T(2, 'expense', 120000, 'c-makan', 'w-cash', 'Makan siang tim'),
  T(2, 'expense', 50000, 'c-transport', 'w-cash', 'Bensin'),
  T(3, 'expense', 350000, 'c-belanja', 'w-bca', 'Belanja bulanan'),
  T(4, 'expense', 1500000, 'c-rumah', 'w-bca', 'Kos / sewa'),
  T(5, 'expense', 200000, 'c-tagihan', 'w-bca', 'Internet & listrik'),
  T(6, 'income', 1500000, 'c-bonus', 'w-bca', 'Project sampingan'),
  T(7, 'expense', 89000, 'c-hiburan', 'w-bca', 'Langganan streaming'),
  T(8, 'expense', 45000, 'c-makan', 'w-cash', 'Makan malam'),
  T(10, 'expense', 250000, 'c-sehat', 'w-bca', 'Vitamin & obat'),
  T(12, 'expense', 60000, 'c-transport', 'w-cash', 'Ojek online'),
  T(14, 'expense', 30000, 'c-makan', 'w-cash', 'Ngopi'),
  // Menabung: transfer Cashflow → Saving (2 leg, note ⇄)
  T(6, 'expense', 2000000, '', 'w-bca', '⇄ Transfer ke Tabungan'),
  T(6, 'income', 2000000, '', 'w-tab', '⇄ Transfer dari BCA'),
  // bulan lalu
  T(33, 'income', 8500000, 'c-gaji', 'w-bca', 'Gaji bulanan'),
  T(35, 'expense', 1500000, 'c-rumah', 'w-bca', 'Kos / sewa'),
  T(36, 'expense', 420000, 'c-belanja', 'w-bca', 'Belanja bulanan'),
  T(38, 'expense', 300000, 'c-makan', 'w-cash', 'Makan di luar'),
  T(40, 'expense', 180000, 'c-tagihan', 'w-bca', 'Pulsa & internet'),
  T(45, 'expense', 150000, 'c-hiburan', 'w-bca', 'Nonton bioskop'),
  // 2-5 bulan lalu (untuk grafik tren)
  T(63, 'income', 8200000, 'c-gaji', 'w-bca', 'Gaji'),
  T(66, 'expense', 2600000, 'c-belanja', 'w-bca', 'Belanja & kebutuhan'),
  T(70, 'expense', 900000, 'c-makan', 'w-cash', 'Makan bulanan'),
  T(93, 'income', 8200000, 'c-gaji', 'w-bca', 'Gaji'),
  T(96, 'expense', 3100000, 'c-rumah', 'w-bca', 'Sewa + tagihan'),
  T(100, 'expense', 700000, 'c-transport', 'w-cash', 'Transport bulanan'),
  T(123, 'income', 8000000, 'c-gaji', 'w-bca', 'Gaji'),
  T(126, 'expense', 2400000, 'c-belanja', 'w-bca', 'Belanja'),
  T(150, 'income', 8000000, 'c-gaji', 'w-bca', 'Gaji'),
  T(153, 'expense', 2800000, 'c-makan', 'w-cash', 'Pengeluaran rutin'),
]

export const DEMO_DEBTS: Debt[] = [
  { id: 'd-1', user_id: 'demo-user', person: 'Budi', amount: 500000, paid_amount: 200000, type: 'hutang', due_date: iso(-14), status: 'belum', note: 'Pinjam buat servis motor', wallet_id: 'w-cash', created_at: NOW },
  { id: 'd-2', user_id: 'demo-user', person: 'Sinta', amount: 300000, paid_amount: 0, type: 'piutang', due_date: iso(-7), status: 'belum', note: 'Talangin tiket konser', wallet_id: 'w-cash', created_at: NOW },
]

export const DEMO_ASSETS: Asset[] = [
  { id: 'a-1', user_id: 'demo-user', name: 'Emas Antam', type: 'emas', quantity: 5, buy_price: 11000000, current_value: 11800000, date: iso(120), note: null, created_at: NOW },
  { id: 'a-2', user_id: 'demo-user', name: 'BBCA', type: 'saham', quantity: 10, buy_price: 9000000, current_value: 10200000, date: iso(90), note: null, created_at: NOW },
]

const curMonth = new Date().getMonth() + 1
const curYear = new Date().getFullYear()
export const DEMO_BUDGETS: Budget[] = [
  { id: 'b-1', user_id: 'demo-user', category_id: 'c-makan', amount: 1500000, month: 0, year: 0, created_at: NOW, category: cat('c-makan') },
  { id: 'b-2', user_id: 'demo-user', category_id: 'c-belanja', amount: 1000000, month: curMonth, year: curYear, created_at: NOW, category: cat('c-belanja') },
  { id: 'b-3', user_id: 'demo-user', category_id: 'c-hiburan', amount: 300000, month: curMonth, year: curYear, created_at: NOW, category: cat('c-hiburan') },
]
