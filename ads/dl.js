const fs = require('fs')
const path = require('path')
const OUT = path.join(__dirname, 'photos')
const TONE = ', warm editorial photography, muted deep maroon brown and warm cream beige color grade, soft natural window light, cinematic, shallow depth of field, premium lifestyle, indonesian, no text, no watermark'
const PHOTOS = [
  { f: 'ad1.png', p: 'young indonesian woman late 20s looking worried and tired at an empty leather wallet on a wooden table at home, end of the month financial stress' },
  { f: 'ad2.png', p: 'indonesian young man lying on sofa at night scrolling smartphone online shopping, a few paper shopping bags nearby, subtle regret and impulse mood' },
  { f: 'ad3.png', p: 'thoughtful indonesian woman early 30s standing by a window holding a cup of coffee, contemplating future savings and rising prices, calm but concerned' },
  { f: 'ad4.png', p: 'calm confident indonesian person relaxing on a couch with coffee and smartphone, organized and fully in control of personal finances, serene and content' },
]
;(async () => {
  for (let i = 0; i < PHOTOS.length; i++) {
    const { f, p } = PHOTOS[i]
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(p + TONE)}?width=1080&height=1350&nologo=true&model=flux&seed=${1700 + i}`
    process.stdout.write(`downloading ${f} ... `)
    const res = await fetch(url)
    if (!res.ok) { console.log('FAIL ' + res.status); continue }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(path.join(OUT, f), buf)
    console.log('OK ' + Math.round(buf.length / 1024) + 'KB')
  }
  console.log('done')
})().catch(e => { console.error('ERR', e.message); process.exit(1) })
