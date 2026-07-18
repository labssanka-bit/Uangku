/** Tipe data domain — mencerminkan skema tabel Supabase. */

export type TxType = 'income' | 'expense'
export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

/** Satu baris item hasil parsing struk oleh Gemini. */
export interface ReceiptItem {
  name: string
  qty?: number
  price: number
}
export type WalletGroup = 'cashflow' | 'saving'
export type DebtType = 'hutang' | 'piutang' // hutang=aku pinjam, piutang=aku beri pinjam
export type DebtStatus = 'belum' | 'lunas'
export type AssetType = 'emas' | 'properti' | 'saham' | 'reksadana' | 'lainnya'

export interface Wallet {
  id: string
  user_id: string
  group: WalletGroup
  name: string
  icon: string
  color: string
  opening_balance: number
  is_default: boolean
  sort_order: number
  created_at: string
}

export interface Debt {
  id: string
  user_id: string
  person: string
  amount: number
  paid_amount: number
  type: DebtType
  due_date: string | null
  status: DebtStatus
  note: string | null
  wallet_id: string | null
  created_at: string
}

export interface Asset {
  id: string
  user_id: string
  name: string
  type: AssetType
  quantity: number
  buy_price: number
  current_value: number
  date: string
  note: string | null
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  currency: string
  opening_balance: number
  is_admin?: boolean
  spending_reasons?: string[] | null
  created_at: string
}

export interface SupportMessage {
  id: string
  user_id: string
  sender: 'user' | 'admin'
  body: string
  read_admin: boolean
  read_user: boolean
  created_at: string
}

export interface Category {
  id: string
  user_id: string
  name: string
  icon: string
  color: string
  type: TxType
  is_default: boolean
  created_at: string
}

export interface Transaction {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  type: TxType
  note: string | null
  date: string // yyyy-MM-dd
  is_recurring: boolean
  wallet_id: string | null
  receipt_url: string | null
  merchant: string | null
  items: ReceiptItem[] | null
  reason?: string | null
  created_at: string
  /** Hasil join kategori (opsional) */
  category?: Category | null
  /** Hasil join dompet (opsional) */
  wallet?: Wallet | null
}

export interface Budget {
  id: string
  user_id: string
  category_id: string
  amount: number
  month: number
  year: number
  created_at: string
  category?: Category | null
}

export interface RecurringTransaction {
  id: string
  user_id: string
  category_id: string | null
  amount: number
  type: TxType
  note: string | null
  frequency: RecurrenceFreq
  next_date: string
  is_active: boolean
  created_at: string
  category?: Category | null
}

/** Payload untuk insert/update transaksi dari form. */
export interface TransactionInput {
  category_id: string | null
  amount: number
  type: TxType
  note: string | null
  date: string
  is_recurring?: boolean
  wallet_id?: string | null
  receipt_url?: string | null
  merchant?: string | null
  items?: ReceiptItem[] | null
  reason?: string | null
}
