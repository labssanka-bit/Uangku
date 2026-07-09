import { CategoryIcon } from './ui/CategoryIcon'
import { Amount } from './ui/Amount'
import { formatTanggal } from '@/lib/format'
import { isTransfer } from '@/lib/summary'
import type { Transaction } from '@/types'

interface Props {
  tx: Transaction
  /** Tampilkan tanggal di bawah nama (untuk list dashboard lintas hari) */
  showDate?: boolean
  onClick?: (tx: Transaction) => void
}

/** Satu baris transaksi: ikon kategori, nama, sub-info, nominal berwarna. */
export function TransactionItem({ tx, showDate = true, onClick }: Props) {
  const title = tx.note?.trim() || tx.category?.name || 'Transaksi'
  const itemCount = tx.items?.length ?? 0
  const sub = [
    tx.category?.name,
    tx.wallet?.name,
    itemCount > 0 ? `🧾 ${itemCount} item` : null,
    showDate ? formatTanggal(tx.date) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <button
      onClick={() => onClick?.(tx)}
      className="flex w-full items-center gap-3 py-2.5 text-left active:opacity-70"
    >
      <CategoryIcon icon={tx.category?.icon} color={tx.category?.color} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-gray-400">{sub}</p>
      </div>
      <Amount
        value={tx.amount}
        signed={tx.type}
        muted={isTransfer(tx)}
        className="text-sm font-bold"
      />
    </button>
  )
}
