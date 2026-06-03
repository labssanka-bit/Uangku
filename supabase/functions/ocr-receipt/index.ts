// Supabase Edge Function: ocr-receipt
// Proxy ke Google Cloud Vision (TEXT_DETECTION). Key rahasia disimpan sbg secret.
//
// Deploy:
//   supabase functions deploy ocr-receipt --no-verify-jwt
//   supabase secrets set GOOGLE_VISION_API_KEY=xxxxx
//
// Request  body: { imageBase64: string }
// Response body: { text: string }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { imageBase64 } = await req.json()
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'imageBase64 wajib diisi' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const key = Deno.env.get('GOOGLE_VISION_API_KEY')
    if (!key) {
      return new Response(JSON.stringify({ error: 'GOOGLE_VISION_API_KEY belum diset' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [
            {
              image: { content: imageBase64 },
              features: [{ type: 'TEXT_DETECTION' }],
            },
          ],
        }),
      }
    )

    const json = await visionRes.json()
    const text: string =
      json?.responses?.[0]?.fullTextAnnotation?.text ??
      json?.responses?.[0]?.textAnnotations?.[0]?.description ??
      ''

    return new Response(JSON.stringify({ text }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
