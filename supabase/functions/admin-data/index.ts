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

    const { action, count } = await req.json().catch(() => ({ action: 'overview' }))

    if (action === 'gen') {
      const n = Math.min(Math.max(parseInt(String(count)) || 0, 1), 200)
      const rows = Array.from({ length: n }, () => ({ code: `FS-${rand4()}-${rand4()}`, note: 'admin' }))
      const { data, error } = await admin
        .from('license_keys')
        .upsert(rows, { onConflict: 'code', ignoreDuplicates: true })
        .select('code')
      if (error) return json({ error: error.message }, 500)
      return json({ generated: data?.map((r: { code: string }) => r.code) ?? [] })
    }

    // overview
    const { data: codes } = await admin
      .from('license_keys')
      .select('code, uses, max_uses, note, created_at, last_used_at')
      .order('created_at', { ascending: false })
    const total = codes?.length ?? 0
    const used = (codes ?? []).filter((c: { uses: number; max_uses: number }) => c.uses >= c.max_uses).length
    const unused = (codes ?? []).filter((c: { uses: number; max_uses: number }) => c.uses < c.max_uses)

    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const { data: profs } = await admin.from('profiles').select('id, full_name, is_admin')
    const pmap = new Map((profs ?? []).map((p: { id: string; full_name: string | null; is_admin: boolean }) => [p.id, p]))
    const users = (list?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      full_name: pmap.get(u.id)?.full_name ?? (u.user_metadata?.full_name ?? ''),
      is_admin: pmap.get(u.id)?.is_admin ?? false,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))

    return json({
      codes: { total, used, unusedCount: unused.length, unused },
      users,
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }

  function json(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
