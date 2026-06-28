/** Tukar kode akses → buat akun (Edge Function 'redeem-license'). */
import { supabase } from './supabase'

export async function redeemLicense(input: {
  code: string
  email: string
  password: string
  full_name: string
}): Promise<void> {
  const { data, error } = await supabase.functions.invoke('redeem-license', { body: input })
  if (error) {
    let detail = error.message || 'Gagal memproses kode akses.'
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
  const d = data as { ok?: boolean; error?: string }
  if (d?.error) throw new Error(d.error)
}
