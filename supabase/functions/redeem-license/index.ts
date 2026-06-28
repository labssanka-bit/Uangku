// Supabase Edge Function: redeem-license
// Gating signup pakai kode akses. Validasi kode → buat akun (langsung aktif,
// tanpa verifikasi email) → tandai kode terpakai. Atomik & pakai service role.
//
// Deploy: supabase functions deploy redeem-license --no-verify-jwt
// (public; belum ada user saat dipanggil)
//
// Request : { code, email, password, full_name }
// Response: { ok: true }  atau  { error }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const { code, email, password, full_name } = await req.json()
    const kode = String(code ?? '').trim()
    const mail = String(email ?? '').trim().toLowerCase()
    if (!kode) return json({ error: 'Kode akses wajib diisi.' }, 400)
    if (!mail || !mail.includes('@')) return json({ error: 'Email tidak valid.' }, 400)
    if (!password || String(password).length < 6) return json({ error: 'Password minimal 6 karakter.' }, 400)

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // 1) Klaim kode (atomik)
    const { data: ok, error: rErr } = await admin.rpc('redeem_license', { p_code: kode })
    if (rErr) return json({ error: 'Gagal memvalidasi kode.' }, 500)
    if (!ok) return json({ error: 'Kode akses tidak valid atau sudah terpakai.' }, 400)

    // 2) Buat akun (langsung terkonfirmasi → bisa login tanpa email)
    const { error: cErr } = await admin.auth.admin.createUser({
      email: mail,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name ?? '' },
    })
    if (cErr) {
      // Kembalikan kuota kode supaya tidak hangus
      await admin.rpc('release_license', { p_code: kode })
      const msg = /already|registered|exists/i.test(cErr.message)
        ? 'Email ini sudah terdaftar. Silakan langsung Masuk.'
        : cErr.message
      return json({ error: msg }, 400)
    }

    return json({ ok: true })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
