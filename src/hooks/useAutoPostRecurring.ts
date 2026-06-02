import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { computeDuePostings } from '@/lib/recurring'
import type { RecurringTransaction } from '@/types'

/**
 * Saat app dibuka, cek transaksi berulang yang sudah jatuh tempo lalu
 * otomatis buat transaksinya + majukan next_date. Jalan sekali per sesi.
 */
export function useAutoPostRecurring() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const done = useRef(false)

  useEffect(() => {
    if (!user || done.current) return
    done.current = true

    ;(async () => {
      // Ambil recurring aktif yang jatuh tempo
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('is_active', true)
        .lte('next_date', new Date().toISOString().slice(0, 10))
      if (error || !data || data.length === 0) return

      const { inserts, advances } = computeDuePostings(data as RecurringTransaction[])
      if (inserts.length === 0) return

      // Sisipkan semua transaksi jatuh tempo
      const { error: insErr } = await supabase.from('transactions').insert(inserts)
      if (insErr) return

      // Majukan next_date tiap recurring
      await Promise.all(
        advances.map((a) =>
          supabase.from('recurring_transactions').update({ next_date: a.next_date }).eq('id', a.id)
        )
      )

      // Refresh data terkait
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['recurring'] })
    })()
  }, [user, qc])
}
