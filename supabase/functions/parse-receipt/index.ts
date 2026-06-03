// Supabase Edge Function: parse-receipt
// Kirim foto struk ke Gemini (multimodal) → kembalikan JSON terstruktur:
// merchant, date, total, category, items[].
//
// Deploy:
//   supabase functions deploy parse-receipt --no-verify-jwt
//   supabase secrets set GEMINI_API_KEY=AIza...   (key dari Google AI Studio)
//
// Request  body: { imageBase64: string, mimeType?: string, categories?: string[] }
// Response body: { merchant, date, total, category, items: [{name, qty, price}], raw }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'gemini-2.5-flash'

// Skema output agar Gemini balikin JSON konsisten
const responseSchema = {
  type: 'OBJECT',
  properties: {
    merchant: { type: 'STRING' },
    date: { type: 'STRING', description: 'format yyyy-MM-dd, kosong jika tak ada' },
    total: { type: 'NUMBER', description: 'total akhir yang dibayar, angka murni tanpa titik' },
    category: { type: 'STRING', description: 'satu kategori paling cocok dari daftar yang diberikan' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          qty: { type: 'NUMBER' },
          price: { type: 'NUMBER', description: 'harga total baris item (qty × satuan), angka murni' },
        },
        required: ['name', 'price'],
      },
    },
  },
  required: ['merchant', 'total', 'items'],
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { imageBase64, mimeType, categories } = await req.json()
    if (!imageBase64) {
      return json({ error: 'imageBase64 wajib diisi' }, 400)
    }

    const key = Deno.env.get('GEMINI_API_KEY')
    if (!key) return json({ error: 'GEMINI_API_KEY belum diset' }, 500)

    const catList: string[] = Array.isArray(categories) && categories.length
      ? categories
      : ['Makanan', 'Transport', 'Belanja', 'Rumah', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya']

    const prompt =
      'Kamu asisten pencatat keuangan. Baca foto struk belanja ini dan ekstrak datanya. ' +
      'Kembalikan nama toko (merchant), tanggal (yyyy-MM-dd), total akhir yang dibayar, ' +
      'dan daftar SEMUA item yang dibeli beserta harga totalnya. ' +
      'Semua nominal sebagai angka murni tanpa titik/koma/Rp. ' +
      `Pilih satu kategori paling cocok dari: ${catList.join(', ')}.`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        // Key format baru (AQ.) wajib via header, bukan query ?key=
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: mimeType || 'image/jpeg', data: imageBase64 } },
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

    return json({
      merchant: parsed.merchant ?? '',
      date: parsed.date ?? null,
      total: Number(parsed.total ?? 0),
      category: parsed.category ?? null,
      items: Array.isArray(parsed.items) ? parsed.items : [],
      raw: textOut,
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
