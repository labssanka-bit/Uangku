import { useMemo } from 'react'
import { useUIStore } from '@/store/uiStore'
import { buildPeriode, ALL_PERIODE, type Periode } from '@/lib/dateRange'

/** Periode aktif: bulan terpilih, atau "Semua Data" (akumulasi lintas bulan/tahun). */
export function useActivePeriode(): Periode {
  const iso = useUIStore((s) => s.activeMonthISO)
  const allTime = useUIStore((s) => s.allTime)
  return useMemo(() => (allTime ? ALL_PERIODE : buildPeriode(new Date(iso))), [iso, allTime])
}
