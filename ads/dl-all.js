const fs = require('fs')
const path = require('path')
const OUT = path.join(__dirname, 'photos')

const ILL = ', flat vector editorial illustration, minimal modern fintech style, warm cream background, deep maroon brown, tan gold and sage accents, soft rounded shapes, clean, centered subject, plain simple background, no text, no watermark'
const PHO = ', ultra realistic photograph, shot on 50mm f1.8, natural skin texture, candid documentary photography, bright soft natural daylight, airy clean interior, high detail, no text, no watermark, not illustration'

const ITEMS = [
  // Ilustrasi flat
  { f: 'ill1.png', p: 'a young woman holding an empty wallet looking surprised, money flying away' + ILL },
  { f: 'ill2.png', p: 'small coins and receipts stacking into a tall pile, concept of small daily spending adding up over time' + ILL },
  { f: 'ill3.png', p: 'a hand watering a small plant whose leaves are gold coins, savings growing upward' + ILL },
  // Foto realistik (cerah)
  { f: 'ph1.png', p: 'calm indonesian woman late 20s smiling softly at home in the morning by a bright window, holding phone' + PHO },
  { f: 'ph2.png', p: 'indonesian young woman sitting on sofa with smartphone and a couple of shopping bags, bright airy living room' + PHO },
  { f: 'ph3.png', p: 'confident relaxed indonesian man late 20s with coffee and phone at a bright modern cafe by the window' + PHO },
]

;(async () => {
  for (let i = 0; i < ITEMS.length; i++) {
    const { f, p } = ITEMS[i]
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1080&height=1080&nologo=true&model=flux&seed=${5300 + i}`
    process.stdout.write(`downloading ${f} ... `)
    try {
      const res = await fetch(url)
      if (!res.ok) { console.log('FAIL ' + res.status); continue }
      const buf = Buffer.from(await res.arrayBuffer())
      fs.writeFileSync(path.join(OUT, f), buf)
      console.log('OK ' + Math.round(buf.length / 1024) + 'KB')
    } catch (e) { console.log('ERR ' + e.message) }
  }
  console.log('done')
})().catch(e => { console.error(e.message); process.exit(1) })
