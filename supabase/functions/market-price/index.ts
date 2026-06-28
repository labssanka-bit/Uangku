// Supabase Edge Function: market-price
// Ambil harga terkini untuk auto-isi "harga sekarang" aset.
//  - emas : harga spot per gram dalam IDR (perkiraan, dari XAU/USD × USD/IDR)
//  - saham: harga per lembar dalam IDR dari Bursa Efek Indonesia (ticker .JK)
//
// Sumber: Yahoo Finance chart API (gratis, tanpa key). Dipanggil server-side
// agar bebas CORS.
//
// Deploy: supabase functions deploy market-price
//
// Request : { kind: 'emas' | 'saham', ticker?: string }
// Response: { price: number, unit: string, source: string, note?: string }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const GRAM_PER_OZ = 31.1034768

async function yahoo(symbol: string): Promise<number | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return null
  const data = await res.json()
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
  return typeof price === 'number' && price > 0 ? price : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { kind, ticker } = await req.json()

    if (kind === 'saham') {
      if (!ticker || typeof ticker !== 'string') return json({ error: 'ticker wajib (mis. BBCA)' }, 400)
      const sym = ticker.toUpperCase().endsWith('.JK') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`
      const price = await yahoo(sym)
      if (price == null) return json({ error: `Ticker ${sym} tidak ditemukan` }, 404)
      return json({ price: Math.round(price), unit: 'lembar', source: `Yahoo Finance (${sym})` })
    }

    if (kind === 'emas') {
      // GC=F = harga 1 troy ounce emas (futures) dalam USD; IDR=X = kurs USD→IDR
      const [xauUsd, usdIdr] = await Promise.all([yahoo('GC=F'), yahoo('IDR=X')])
      if (xauUsd == null || usdIdr == null) return json({ error: 'Gagal ambil harga emas spot' }, 502)
      const idrPerGram = (xauUsd / GRAM_PER_OZ) * usdIdr
      return json({
        price: Math.round(idrPerGram),
        unit: 'gram',
        source: 'Yahoo Finance (XAU/USD × USD/IDR)',
        note: 'Harga spot internasional (perkiraan). Harga Antam biasanya lebih tinggi karena premium.',
      })
    }

    return json({ error: "kind harus 'emas' atau 'saham'" }, 400)
  } catch (e) {
    return json({ error: String(e) }, 500)
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
