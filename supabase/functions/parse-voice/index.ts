// Supabase Edge Function: parse-voice
// Terima audio voice-note (base64) → Gemini (multimodal audio) → JSON:
// { text, amount, type, category }.
//
// Dipakai untuk iOS/Safari yang TIDAK mendukung Web Speech API.
// Chrome Android/Desktop tetap pakai Web Speech API on-device (gratis, instan).
//
// Deploy:
//   supabase functions deploy parse-voice --no-verify-jwt
//   (pakai secret GEMINI_API_KEY yang sama dengan parse-receipt)
//
// Request  body: { audioBase64: string, mimeType?: string, categories?: string[] }
// Response body: { text, amount, type, category }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'gemini-2.5-flash'

const responseSchema = {
  type: 'OBJECT',
  properties: {
    text: { type: 'STRING', description: 'transkrip ucapan apa adanya' },
    amount: { type: 'NUMBER', description: 'nominal rupiah sebagai angka murni tanpa titik, 0 jika tak ada' },
    type: { type: 'STRING', description: 'income atau expense; default expense' },
    category: { type: 'STRING', description: 'satu kategori paling cocok dari daftar yang diberikan, kosong jika tak yakin' },
  },
  required: ['text', 'amount'],
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { audioBase64, mimeType, categories } = await req.json()
    if (!audioBase64) return json({ error: 'audioBase64 wajib diisi' }, 400)

    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) return json({ error: 'GEMINI_API_KEY belum diset' }, 500)

    const catList: string[] = Array.isArray(categories) && categories.length
      ? categories
      : ['Makanan', 'Transport', 'Belanja', 'Rumah', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya']

    const prompt =
      'Kamu asisten pencatat keuangan berbahasa Indonesia. ' +
      'Dengarkan rekaman suara ini (bahasa Indonesia) tentang sebuah transaksi keuangan. ' +
      'Tugas: (1) transkrip apa yang diucapkan, (2) ekstrak nominal rupiah sebagai angka murni ' +
      '(contoh: "tiga puluh ribu"→30000, "lima puluh ribu"→50000, "1,5 juta"→1500000), ' +
      '(3) tentukan tipe: "income" jika pemasukan/gaji/terima uang, selain itu "expense", ' +
      `(4) pilih satu kategori paling cocok dari: ${catList.join(', ')}.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType || 'audio/webm', data: audioBase64 } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature: 0.1,
          },
        }),
      }
    )

    const data = await geminiRes.json()
    if (!geminiRes.ok) {
      return json({ error: data?.error?.message || 'Gemini error', detail: data }, 502)
    }

    const textOut: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(textOut)
    } catch {
      return json({ error: 'Gagal parse JSON Gemini', raw: textOut }, 502)
    }

    const t = String(parsed.type ?? 'expense').toLowerCase()
    return json({
      text: parsed.text ?? '',
      amount: Number(parsed.amount ?? 0),
      type: t === 'income' ? 'income' : 'expense',
      category: parsed.category ?? null,
    })
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
