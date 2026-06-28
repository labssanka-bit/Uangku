/** Ambil harga pasar terkini (emas spot / saham IDX) via Edge Function 'market-price'. */
import { supabase } from './supabase'

export interface MarketPrice {
  price: number
  unit: string // 'gram' | 'lembar'
  source: string
  note?: string
}

export async function fetchMarketPrice(
  kind: 'emas' | 'saham',
  ticker?: string
): Promise<MarketPrice> {
  const { data, error } = await supabase.functions.invoke('market-price', {
    body: { kind, ticker },
  })
  if (error) {
    let detail = error.message || 'Gagal mengambil harga.'
    try {
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json()
        if (body?.error) detail = String(body.error)
      }
    } catch {
      /* abaikan */
    }
    throw new Error(detail)
  }
  const d = data as Partial<MarketPrice> & { error?: string }
  if (d.error) throw new Error(d.error)
  return { price: Number(d.price ?? 0), unit: d.unit ?? '', source: d.source ?? '', note: d.note }
}
