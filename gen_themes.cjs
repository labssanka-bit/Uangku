// Generate src/themes.css — 17 tema via CSS variable (HSL channels).
// Tiap tema override skala --m (brand) + --d (accent) + --app-bg.
// tailwind.config memetakan maroon/dusty ke hsl(var(--m-700) / alpha).
const fs = require('fs')
const path = require('path')

// lightness per shade (mirip skala Tailwind)
const ML = { 50: 96, 100: 92, 200: 84, 300: 74, 400: 62, 500: 51, 600: 43, 700: 35, 800: 28, 900: 22 }
const DL = { 50: 96, 100: 91, 200: 83, 300: 73, 400: 63, 500: 54, 600: 45 }

// id, nama, hue & sat brand, hue & sat accent
const THEMES = [
  ['maroon',   'Maroon Klasik',   345, 50, 340, 40],
  ['rose',     'Rose Quartz',     342, 60, 330, 52],
  ['cherry',   'Cherry Wine',     352, 62, 358, 50],
  ['coral',    'Sunset Coral',     12, 70,  25, 60],
  ['amber',    'Amber Senja',      35, 72,  45, 62],
  ['mocha',    'Cokelat Mocha',    25, 38,  30, 30],
  ['olive',    'Olive Hutan',      78, 42,  68, 36],
  ['emerald',  'Emerald Hutan',   152, 52, 162, 44],
  ['mint',     'Tosca Mint',      165, 46, 175, 40],
  ['teal',     'Teal Laut',       184, 55, 192, 46],
  ['sky',      'Langit Cerah',    202, 66, 196, 56],
  ['sapphire', 'Sapphire',        222, 70, 226, 60],
  ['indigo',   'Midnight Indigo', 243, 56, 252, 46],
  ['lavender', 'Lavender Lembut', 255, 42, 268, 36],
  ['ungu',     'Royal Ungu',      272, 52, 286, 46],
  ['slate',    'Slate Pro',       215, 26, 220, 20],
  ['graphite', 'Graphite Gelap',  220, 10, 220,  9],
]

function ch(h, s, l) { return `${h} ${s}% ${l}%` } // channels utk hsl(var/<alpha>)

function block(sel, h, s, ah, as) {
  const lines = []
  for (const k of Object.keys(ML)) {
    const sat = (+k <= 100) ? Math.round(s * 0.5) : (+k >= 800 ? Math.round(s * 0.92) : s)
    lines.push(`--m-${k}:${ch(h, sat, ML[k])}`)
  }
  for (const k of Object.keys(DL)) {
    const sat = (+k <= 100) ? Math.round(as * 0.5) : as
    lines.push(`--d-${k}:${ch(ah, sat, DL[k])}`)
  }
  // background lembut bernuansa tema (light) + versi dark
  lines.push(`--app-bg:${ch(h, Math.min(s, 28), 96.5)}`)
  lines.push(`--app-bg-dark:${ch(h, Math.min(s, 22), 9)}`)
  lines.push(`--surface-dark:${ch(h, Math.min(s, 20), 13)}`)
  return `${sel}{${lines.join(';')}}`
}

const out = [
  '/* AUTO-GENERATED oleh gen_themes.cjs — jangan edit manual. 17 tema. */',
]
// default (maroon) di :root juga
const def = THEMES[0]
out.push(block(':root', def[2], def[3], def[4], def[5]))
for (const [id, , h, s, ah, as] of THEMES) {
  out.push(block(`[data-theme="${id}"]`, h, s, ah, as))
}

const dest = path.join(__dirname, 'src', 'themes.css')
fs.writeFileSync(dest, out.join('\n') + '\n')
console.log('wrote ' + dest + ' (' + THEMES.length + ' tema)')
// daftar utk UI
console.log(JSON.stringify(THEMES.map(t => ({ id: t[0], name: t[1] }))))
