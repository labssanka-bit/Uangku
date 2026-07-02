// Supabase Edge Function: scalev-webhook
// Dipanggil Scalev saat order LUNAS. Ambil 1 kode akses tersisa (atomik) lalu
// kirim email otomatis ke pembeli (welcome + link + kode + cara aktivasi).
//
// Deploy: supabase functions deploy scalev-webhook --no-verify-jwt
// URL webhook (set di Scalev):
//   https://<PROJECT>.functions.supabase.co/scalev-webhook?token=<WEBHOOK_SECRET>
//
// Secrets yang perlu di-set (supabase secrets set ...):
//   RESEND_API_KEY   = re_xxx           (WAJIB — kirim email)
//   WEBHOOK_SECRET   = string rahasia   (WAJIB — cegah orang lain panggil)
//   MAIL_FROM        = "Finplan Sanka <noreply@finplansanka.com>"  (opsional)
//   ADMIN_EMAIL      = email admin buat notifikasi stok kode habis  (opsional)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const APP_URL = 'https://finplansanka.com'
const FROM = Deno.env.get('MAIL_FROM') ?? 'Finplan Sanka <noreply@finplansanka.com>'
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL') ?? 'anugrahirsan75@gmail.com'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok')

  // 1) Verifikasi rahasia (query ?token= atau header x-webhook-token)
  const secret = Deno.env.get('WEBHOOK_SECRET')
  const url = new URL(req.url)
  const token = url.searchParams.get('token') ?? req.headers.get('x-webhook-token') ?? ''
  if (secret && token !== secret) return json({ error: 'unauthorized' }, 401)

  let payload: unknown = {}
  try { payload = await req.json() } catch { /* biarkan {} */ }

  // 2) Hanya proses kalau status = lunas/paid (kalau status tak dikenal → tetap lanjut)
  const status = String(pick(payload, ['status', 'order_status', 'payment_status', 'data.status']) ?? '').toLowerCase()
  const paidWords = ['paid', 'lunas', 'settlement', 'success', 'completed', 'capture', 'selesai']
  const unpaidWords = ['pending', 'cancel', 'expire', 'fail', 'refund', 'unpaid', 'batal']
  if (status && !paidWords.some((w) => status.includes(w))) {
    if (unpaidWords.some((w) => status.includes(w))) return json({ ok: true, skipped: `status=${status}` })
    // status ada tapi tak jelas → tetap lanjut (better deliver)
  }

  // 3) Ambil email pembeli (fleksibel — cari di banyak kemungkinan field)
  const email = String(
    pick(payload, [
      'email', 'customer_email', 'buyer_email', 'contact_email',
      'customer.email', 'buyer.email', 'data.customer.email', 'data.email',
      'order.customer.email', 'order.email',
    ]) ?? deepFindEmail(payload) ?? ''
  ).trim().toLowerCase()

  const name = String(
    pick(payload, ['name', 'customer_name', 'buyer_name', 'full_name', 'customer.name', 'data.customer.name', 'order.customer.name']) ?? ''
  ).trim() || 'Kak'

  if (!email || !email.includes('@')) {
    // Tak ada email → jangan error (biar Scalev tak retry terus), tapi kabari admin
    await sendMail(ADMIN_EMAIL, '⚠️ Order Finplan Sanka tanpa email',
      `<p>Ada order masuk tapi email pembeli tidak terbaca dari webhook. Kirim kode manual.</p><pre>${escapeHtml(JSON.stringify(payload).slice(0, 1500))}</pre>`)
    return json({ ok: true, warn: 'no email in payload' })
  }

  // 4) Ambil 1 kode tersisa (atomik, tak meng-consume kuota → pembeli tetap bisa pakai)
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data: code, error: cErr } = await admin.rpc('claim_next_license', { p_email: email })
  if (cErr) {
    await sendMail(ADMIN_EMAIL, '⚠️ Gagal ambil kode (Finplan Sanka)',
      `<p>claim_next_license error untuk ${escapeHtml(email)}: ${escapeHtml(cErr.message)}</p>`)
    return json({ error: 'claim failed' }, 500)
  }
  if (!code) {
    // STOK KODE HABIS → kabari admin supaya generate lagi & kirim manual
    await sendMail(ADMIN_EMAIL, '🚨 STOK KODE HABIS — Finplan Sanka',
      `<p>Order dari <b>${escapeHtml(email)}</b> masuk tapi <b>tidak ada kode tersisa</b>. Buka Panel Admin → tab Kode → Generate, lalu kirim ke pembeli.</p>`)
    return json({ ok: true, warn: 'out of codes, admin notified' })
  }

  // 5) Kirim email pembeli
  const sent = await sendMail(email, `🎉 Akses Finplan Sanka kamu — kode & cara aktivasi`, buyerHtml(name, String(code)))
  if (!sent.ok) {
    await sendMail(ADMIN_EMAIL, '⚠️ Email pembeli gagal terkirim (Finplan Sanka)',
      `<p>Gagal kirim ke ${escapeHtml(email)} (kode ${escapeHtml(String(code))}). Kirim manual.</p><pre>${escapeHtml(sent.detail)}</pre>`)
    return json({ ok: true, warn: 'email failed, admin notified', code })
  }

  return json({ ok: true, email, delivered: true })
})

// ── Email pembeli (HTML) ──────────────────────────────────────────────────
function buyerHtml(name: string, code: string) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#2b2b2b">
    <h2 style="color:#5C1A2B;margin:0 0 8px">Halo ${escapeHtml(name)} 👋</h2>
    <p>Terima kasih sudah membeli <b>Finplan Sanka</b> 🎉 Akses kamu berlaku <b>seumur hidup</b>.</p>
    <div style="background:#F2ECE2;border-radius:14px;padding:16px 18px;margin:16px 0">
      <p style="margin:0 0 6px;font-size:13px;color:#6b5b4b">KODE AKSES</p>
      <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:2px;color:#5C1A2B">${escapeHtml(code)}</p>
    </div>
    <p style="margin:0 0 4px"><b>Cara aktifkan (1 menit):</b></p>
    <ol style="margin:0 0 16px;padding-left:20px;line-height:1.7">
      <li>Buka <a href="${APP_URL}" style="color:#5C1A2B">${APP_URL}</a></li>
      <li>Tap <b>Daftar</b></li>
      <li>Masukkan Kode Akses di atas + email &amp; password kamu</li>
      <li>Selesai! Langsung bisa dipakai selamanya ✅</li>
    </ol>
    <p style="font-size:13px;color:#6b5b4b">Kode hanya bisa dipakai 1x untuk membuat 1 akun. Simpan email ini.
    Lupa password nanti? Pakai "Lupa password?" di halaman masuk.</p>
    <p style="font-size:13px;color:#6b5b4b">Ada kendala? Balas email ini, kami bantu 🙏</p>
    <p style="margin-top:20px;color:#5C1A2B"><b>Tim Finplan Sanka</b><br><a href="${APP_URL}" style="color:#5C1A2B">${APP_URL}</a></p>
  </div>`
}

// ── Resend ─────────────────────────────────────────────────────────────────
async function sendMail(to: string, subject: string, html: string): Promise<{ ok: boolean; detail: string }> {
  const key = Deno.env.get('RESEND_API_KEY')
  if (!key) return { ok: false, detail: 'RESEND_API_KEY belum di-set' }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
    const t = await r.text()
    return { ok: r.ok, detail: t }
  } catch (e) {
    return { ok: false, detail: String(e) }
  }
}

// ── Util: ambil nilai nested by path list ("a.b.c") ────────────────────────
function pick(obj: unknown, paths: string[]): unknown {
  for (const p of paths) {
    let cur: unknown = obj
    let ok = true
    for (const seg of p.split('.')) {
      if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[seg]
      } else { ok = false; break }
    }
    if (ok && cur != null && cur !== '') return cur
  }
  return undefined
}

// Cari string ber-format email di mana pun dalam payload (fallback)
function deepFindEmail(obj: unknown, depth = 0): string | undefined {
  if (depth > 6 || obj == null) return undefined
  if (typeof obj === 'string') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj) ? obj : undefined
  if (typeof obj === 'object') {
    for (const v of Object.values(obj as Record<string, unknown>)) {
      const f = deepFindEmail(v, depth + 1)
      if (f) return f
    }
  }
  return undefined
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}
