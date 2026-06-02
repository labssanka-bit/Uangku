/** Tipe data domain — mencerminkan skema tabel Supabase. */

export type TxType = 'income' | 'expense'
export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Profile {
  id: string
  full_name: string | null
  currency: string
  opening_balance: number
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
  created_at: string
  /** Hasil join kategori (opsional) */
  category?: Category | null
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
}
