/** Parsing struk via Gemini (Edge Function 'parse-receipt') + upload foto. */
import { supabase } from './supabase'
import type { ReceiptItem } from '@/types'

export interface ReceiptParse {
  merchant: string
  date: string | null // yyyy-MM-dd
  total: number
  category: string | null
  items: ReceiptItem[]
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result)
      resolve(s.includes(',') ? s.split(',')[1] : s)
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/**
 * Kirim foto struk ke Gemini. `categories` dikirim agar Gemini memilih
 * kategori dari daftar milik user.
 */
export async function parseReceipt(file: File, categories: string[]): Promise<ReceiptParse> {
  const imageBase64 = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('parse-receipt', {
    body: { imageBase64, mimeType: file.type || 'image/jpeg', categories },
  })
  if (error) {
    // Ambil pesan error asli dari body function (FunctionsHttpError menyimpan Response di .context)
    let detail = error.message || 'Gagal membaca struk.'
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
  const d = data as Partial<ReceiptParse> & { error?: string }
  if (d.error) throw new Error(d.error)

  // Normalisasi item (buang yang tak valid)
  const items: ReceiptItem[] = (d.items ?? [])
    .filter((it) => it && it.name && Number(it.price) > 0)
    .map((it) => ({ name: String(it.name), qty: it.qty ? Number(it.qty) : undefined, price: Number(it.price) }))

  return {
    merchant: d.merchant ?? '',
    date: d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : null,
    total: Number(d.total ?? 0),
    category: d.category ?? null,
    items,
  }
}

export interface VoiceParse {
  text: string
  amount: number
  type: 'income' | 'expense'
  category: string | null
}

/**
 * Kirim audio voice-note ke Gemini (Edge Function 'parse-voice') untuk
 * transkrip + ekstraksi nominal/kategori. Dipakai di iOS/Safari yang tak
 * mendukung Web Speech API.
 */
export async function parseVoiceAudio(
  audioBase64: string,
  mimeType: string,
  categories: string[]
): Promise<VoiceParse> {
  const { data, error } = await supabase.functions.invoke('parse-voice', {
    body: { audioBase64, mimeType, categories },
  })
  if (error) {
    let detail = error.message || 'Gagal memproses suara.'
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
  const d = data as Partial<VoiceParse> & { error?: string }
  if (d.error) throw new Error(d.error)
  return {
    text: d.text ?? '',
    amount: Number(d.amount ?? 0),
    type: d.type === 'income' ? 'income' : 'expense',
    category: d.category ?? null,
  }
}

/** Unggah foto struk ke Storage (bucket 'receipts'), kembalikan URL publik. */
export async function uploadReceipt(file: File, userId: string): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: false })
  if (error) {
    console.warn('[UangKu] Upload struk gagal:', error.message)
    return null
  }
  const { data } = supabase.storage.from('receipts').getPublicUrl(path)
  return data.publicUrl
}
