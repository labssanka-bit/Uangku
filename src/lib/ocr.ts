/** OCR struk via Supabase Edge Function (proxy Google Vision). */
import { supabase } from './supabase'
import { extractAmount } from './parseAmount'

export interface ReceiptResult {
  amount: number
  date: string | null // yyyy-MM-dd
  text: string
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result)
      resolve(s.includes(',') ? s.split(',')[1] : s) // buang prefix data:...;base64,
    }
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Cari tanggal dd/mm/yyyy | dd-mm-yyyy | dd.mm.yy(yy) di teks. */
function extractDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/)
  if (!m) return null
  let [, d, mo, y] = m
  if (y.length === 2) y = '20' + y
  const dd = d.padStart(2, '0')
  const mm = mo.padStart(2, '0')
  if (+mm > 12 || +dd > 31) return null
  return `${y}-${mm}-${dd}`
}

/**
 * Kirim foto struk ke Edge Function 'ocr-receipt', ambil teks, parse total + tanggal.
 * Cari baris dengan kata "total/jumlah/grand" untuk nominal lebih akurat;
 * fallback ke angka terbesar.
 */
export async function ocrReceipt(file: File): Promise<ReceiptResult> {
  const imageBase64 = await fileToBase64(file)
  const { data, error } = await supabase.functions.invoke('ocr-receipt', {
    body: { imageBase64 },
  })
  if (error) throw new Error(error.message || 'OCR gagal.')
  const text: string = (data as { text?: string })?.text ?? ''

  // Prioritaskan baris bertuliskan total
  let amount = 0
  const lines = text.split(/\n/)
  for (const line of lines) {
    if (/total|grand|jumlah|bayar/i.test(line)) {
      const a = extractAmount(line)
      if (a > amount) amount = a
    }
  }
  if (amount === 0) amount = extractAmount(text)

  return { amount, date: extractDate(text), text }
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
