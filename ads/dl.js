const fs = require('fs')
const path = require('path')
const OUT = path.join(__dirname, 'photos')
// Cerah & airy — daylight tinggi, bersih, hangat (bukan moody/gelap)
const TONE = ', bright airy editorial photography, soft natural daylight, high-key lighting, clean modern interior, white and warm cream tones, fresh and light, cinematic, shallow depth of field, premium lifestyle, indonesian, candid, no text, no watermark'
const PHOTOS = [
  { f: 'ad1.png', p: 'young indonesian woman late 20s sitting by a bright window at a clean modern home, checking finances on her phone with a slightly worried but hopeful expression, lots of natural daylight' },
  { f: 'ad2.png', p: 'cheerful indonesian young woman holding a couple of shopping bags and smartphone in a bright airy living room, impulse shopping moment, sunlight streaming in' },
  { f: 'ad3.png', p: 'indonesian woman early 30s standing by a large bright window holding a cup of coffee, thoughtful and calm, planning her future, soft morning daylight, airy minimal room' },
  { f: 'ad4.png', p: 'relaxed happy indonesian person smiling on a sofa in a bright sunny living room, holding coffee and smartphone, feeling calm and in control, fresh airy daylight' },
]
;(async () => {
  for (let i = 0; i < PHOTOS.length; i++) {
    const { f, p } = PHOTOS[i]
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p + TONE)}?width=1080&height=1350&nologo=true&model=flux&seed=${4200 + i}`
    process.stdout.write(`downloading ${f} ... `)
    const res = await fetch(url)
    if (!res.ok) { console.log('FAIL ' + res.status); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(path.join(OUT, f), buf)
    console.log('OK ' + Math.round(buf.length / 1024) + 'KB')
  }
  console.log('done')
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
