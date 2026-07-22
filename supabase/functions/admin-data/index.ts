// Supabase Edge Function: admin-data
// Panel admin: daftar pengguna + stok kode lisensi + generate kode baru.
// Gated: hanya profiles.is_admin. Pakai service role internal.
//
// Deploy: supabase functions deploy admin-data
// Request: { action: 'overview' } | { action: 'gen', count: number }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function rand4() {
  return Array.from({ length: 4 }, () => '0123456789ABCDEF'[Math.floor(Math.random() * 16)]).join('')
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

/** Email pembeli (HTML) — mengikuti template WA. */
function buyerEmailHtml(nama: string, kode: string, masaAktif = 'Selamanya (lifetime)') {
  const APP = 'https://finplansanka.com'
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:auto;color:#2b2b2b;line-height:1.6">
    <h2 style="color:#5C1A2B;margin:0 0 8px">Halo ${esc(nama)} 👋</h2>
    <p>Terima kasih sudah membeli <b>Finplan Sanka</b> 🎉</p>
    <p style="margin:0 0 6px">Ini akses <b>seumur hidup</b>mu:</p>
    <div style="background:#F2ECE2;border-radius:14px;padding:16px 18px;margin:12px 0">
      <p style="margin:0 0 6px;font-size:13px;color:#6b5b4b">🔑 KODE AKSES</p>
      <p style="margin:0;font-size:24px;font-weight:800;letter-spacing:2px;color:#5C1A2B">${esc(kode)}</p>
      <p style="margin:10px 0 0;font-size:13px;color:#6b5b4b">⏳ Masa aktif: <b>${esc(masaAktif)}</b></p>
      <p style="margin:4px 0 0;font-size:13px;color:#6b5b4b">🌐 Aplikasi: <a href="${APP}" style="color:#5C1A2B">${APP}</a></p>
    </div>
    <p style="margin:0 0 4px"><b>Cara aktifkan (1 menit):</b></p>
    <ol style="margin:0 0 14px;padding-left:20px">
      <li>Buka <a href="${APP}" style="color:#5C1A2B">${APP}</a></li>
      <li>Tap <b>Daftar</b></li>
      <li>Masukkan Kode Akses di atas + email &amp; password kamu</li>
      <li>Selesai! Langsung bisa dipakai selamanya ✅</li>
    </ol>
    <p style="font-size:13px;color:#6b5b4b">Simpan email ini ya, kodenya cuma bisa dipakai 1x untuk buat akun.</p>
    <p style="font-size:13px;color:#6b5b4b">Ada kendala? Balas email ini, aku bantu 🙏</p>
    <p style="margin-top:18px;color:#5C1A2B"><b>Tim Finplan Sanka</b><br><a href="${APP}" style="color:#5C1A2B">${APP}</a></p>
  </div>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON = Deno.env.get('SUPABASE_ANON_KEY')!
    const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
    if (!jwt) return json({ error: 'Tidak terautentikasi.' }, 401)

    // Identitas pemanggil
    const authed = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } })
    const { data: ures } = await authed.auth.getUser()
    if (!ures?.user) return json({ error: 'Sesi tidak valid.' }, 401)

    const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
    const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', ures.user.id).single()
    if (!prof?.is_admin) return json({ error: 'Khusus admin.' }, 403)

    const { action, count, userId, code, label, email, name, months } = await req.json().catch(() => ({ action: 'overview' }))
    // Masa aktif: null/0 = lifetime, angka = jumlah bulan
    const dur: number | null = months === null || months === undefined || Number(months) <= 0 ? null : Number(months)
    const durLabel = dur ? `${dur} bulan` : 'Selamanya (lifetime)'

    if (action === 'send_email') {
      // Kirim email kode + cara aktivasi ke pembeli (template WA) via Resend.
      const kode = String(code || '').trim().toUpperCase()
      const mail = String(email || '').trim().toLowerCase()
      const nama = String(name || '').trim() || 'Kak'
      if (!kode) return json({ error: 'Pilih kode dulu.' }, 400)
      if (!mail || !mail.includes('@')) return json({ error: 'Email pembeli tidak valid.' }, 400)

      const RESEND = Deno.env.get('RESEND_API_KEY')
      if (!RESEND) return json({ error: 'RESEND_API_KEY belum di-set. Minta admin sistem set dulu.' }, 400)
      const FROM = Deno.env.get('MAIL_FROM') ?? 'Finplan Sanka <noreply@finplansanka.com>'

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM, to: mail, subject: '🎉 Akses Finplan Sanka kamu — kode & cara aktivasi', html: buyerEmailHtml(nama, kode, durLabel) }),
      })
      if (!res.ok) {
        const detail = await res.text()
        return json({ error: 'Gagal kirim email: ' + detail.slice(0, 300) }, 500)
      }
      // Tandai kode "sudah dikasih" (reserved) + simpan masa aktifnya
      await admin
        .from('license_keys')
        .update({ reserved_email: `${nama} <${mail}>`, reserved_at: new Date().toISOString(), duration_months: dur })
        .eq('code', kode)
        .lt('uses', 1)
      return json({ ok: true })
    }

    if (action === 'gen') {
      const n = Math.min(Math.max(parseInt(String(count)) || 0, 1), 200)
      const rows = Array.from({ length: n }, () => ({ code: `FS-${rand4()}-${rand4()}`, note: 'admin', duration_months: dur }))
      const { data, error } = await admin
        .from('license_keys')
        .upsert(rows, { onConflict: 'code', ignoreDuplicates: true })
        .select('code')
      if (error) return json({ error: error.message }, 500)
      return json({ generated: data?.map((r: { code: string }) => r.code) ?? [] })
    }

    if (action === 'reserve') {
      // Tandai kode "sudah dikasih ke calon pembeli" (manual). label = nama/no WA.
      const kode = String(code || '').trim().toUpperCase()
      const lbl = String(label || '').trim()
      if (!kode) return json({ error: 'Kode wajib.' }, 400)
      if (!lbl) return json({ error: 'Isi nama/no WA penerima.' }, 400)
      const { data, error } = await admin
        .from('license_keys')
        .update({ reserved_email: lbl, reserved_at: new Date().toISOString(), duration_months: dur })
        .eq('code', kode)
        .lt('uses', 1)
        .select('code')
      if (error) return json({ error: error.message }, 500)
      if (!data || data.length === 0) return json({ error: 'Kode tak ditemukan / sudah terpakai.' }, 400)
      return json({ ok: true })
    }

    if (action === 'unreserve') {
      // Batalkan tanda "sudah dikasih" → kode kembali ke daftar tersedia.
      const kode = String(code || '').trim().toUpperCase()
      if (!kode) return json({ error: 'Kode wajib.' }, 400)
      const { error } = await admin
        .from('license_keys')
        .update({ reserved_email: null, reserved_at: null })
        .eq('code', kode)
      if (error) return json({ error: error.message }, 500)
      return json({ ok: true })
    }

    if (action === 'delete') {
      const uid = String(userId || '')
      if (!uid) return json({ error: 'userId wajib.' }, 400)
      if (uid === ures.user.id) return json({ error: 'Tidak bisa menghapus akun admin yang sedang login.' }, 400)
      const { error } = await admin.auth.admin.deleteUser(uid)
      if (error) return json({ error: error.message }, 500)
      // Bebaskan tautan kode (kode tetap terpakai/ tercatat email-nya)
      await admin.from('license_keys').update({ used_by: null }).eq('used_by', uid)
      return json({ ok: true })
    }

    // overview
    const { data: codes } = await admin
      .from('license_keys')
      .select('code, uses, max_uses, note, created_at, last_used_at, used_by, used_email, reserved_email, reserved_at, duration_months')
      .order('created_at', { ascending: false })
    type Code = { uses: number; max_uses: number; reserved_email: string | null }
    const total = codes?.length ?? 0
    const used = (codes ?? []).filter((c: Code) => c.uses >= c.max_uses).length
    // reserved = sudah dikirim otomatis ke pembeli, tunggu aktivasi (jangan kirim ulang)
    const reserved = (codes ?? []).filter((c: Code) => c.uses < c.max_uses && c.reserved_email)
    // available = benar-benar bebas (aman dikirim manual)
    const unused = (codes ?? []).filter((c: Code) => c.uses < c.max_uses && !c.reserved_email)
    // map user → kode yang dipakai
    const codeByUser = new Map<string, string>()
    for (const c of codes ?? []) if (c.used_by) codeByUser.set(c.used_by, c.code)

    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const { data: profs } = await admin.from('profiles').select('id, full_name, is_admin, last_seen, access_until')
    type Prof = { id: string; full_name: string | null; is_admin: boolean; last_seen: string | null; access_until: string | null }
    const pmap = new Map((profs ?? []).map((p: Prof) => [p.id, p]))

    // Statistik kuota DB + jumlah transaksi per pengguna
    const { data: usageRaw } = await admin.rpc('admin_usage_stats')
    const usage = (usageRaw ?? {}) as {
      db_bytes?: number; tx_total?: number; tx_bytes?: number
      tx_by_user?: { user_id: string; n: number }[]
      tables?: { name: string; bytes: number }[]
    }
    const txByUser = new Map<string, number>((usage.tx_by_user ?? []).map((r) => [r.user_id, r.n]))
    const txTotal = usage.tx_total ?? 0
    const txBytes = usage.tx_bytes ?? 0
    // Estimasi byte per user = porsi transaksinya dari total tabel transactions
    const bytesPerTx = txTotal > 0 ? txBytes / txTotal : 0

    const users = (list?.users ?? []).map((u) => {
      const n = txByUser.get(u.id) ?? 0
      return {
        id: u.id,
        email: u.email,
        full_name: pmap.get(u.id)?.full_name ?? (u.user_metadata?.full_name ?? ''),
        is_admin: pmap.get(u.id)?.is_admin ?? false,
        code: codeByUser.get(u.id) ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        last_seen: pmap.get(u.id)?.last_seen ?? null,
        access_until: pmap.get(u.id)?.access_until ?? null,
        tx_count: n,
        est_bytes: Math.round(n * bytesPerTx),
      }
    })

    const DB_LIMIT_BYTES = 500 * 1024 * 1024 // Supabase free tier ~500 MB

    return json({
      codes: { total, used, unusedCount: unused.length, unused, reservedCount: reserved.length, reserved },
      users,
      usage: {
        db_bytes: usage.db_bytes ?? 0,
        limit_bytes: DB_LIMIT_BYTES,
        tx_total: txTotal,
        tables: usage.tables ?? [],
      },
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
