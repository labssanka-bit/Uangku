/* ============================================================
   4 KONTEN META ADS — Finplan Sanka.
   Pola NeuroKids (foto + overlay copy) tapi DESAIN Finplan:
   palette editorial 'Quiet Wealth' (dark raspberry + cream + tan gold),
   font Instrument Serif (display) + Plus Jakarta Sans (body).
   Foto: ads/photos/ (Pollinations; ganti Higgsfield kalau mau).
   Output 1080x1350 (4:5 feed Meta) → ads/out/. Run: node gen_meta_ads.js
   ============================================================ */
const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PDIR = path.join(__dirname, 'photos')
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

const CTA = 'Mulai Rp49.900 — Keputusan untuk Dirimu 1 Tahun Lagi'
const VALUE = 'Catat · Dompet · Hutang · Aset & Emas · Insight · HP & Laptop'

const ADS = [
  {
    file: 'Meta_1_Gaji_Habis', photo: 'ad1.png',
    hook: 'Gaji Masuk, Belum Tanggal 20 Udah <span class="r">Habis</span>?',
    problem: 'Bukan kamu yang boros — kamu cuma belum tahu uangmu lari ke mana. 😮‍💨',
    benefits: [
      'Tahu “uang aman harian” kamu tiap hari',
      'Catat cuma 3 detik — foto struk (AI) / suara',
      'Lihat bocoran pengeluaran, langsung dipangkas',
    ],
  },
  {
    file: 'Meta_2_Bad_Mood', photo: 'ad2.png',
    hook: 'Checkout Pas <span class="c">Bad Mood</span>, Nyesel Pas Liat Saldo.',
    problem: 'Pengeluaran “receh” tiap hari diam-diam numpuk jadi jutaan. 🛒',
    benefits: [
      'Rekap per kategori bikin pola belanja kelihatan',
      'Insight otomatis: “pengeluaran naik 20%”',
      'Sadar sebelum saldo telanjur bocor',
    ],
  },
  {
    file: 'Meta_3_Inflasi', photo: 'ad3.png',
    hook: 'Harga Naik Terus. Uangmu Diam-Diam <span class="r">Menyusut</span>.',
    problem: 'Rp100rb hari ini cuma terasa ~Rp70rb dalam 10 tahun. Nunggu = rugi pelan-pelan. 📉',
    benefits: [
      'Bangun dana darurat & tabungan terukur',
      'Pantau emas & aset — harga terkini otomatis',
      'Rasio nabung naik, tiap bulan kelihatan',
    ],
  },
  {
    file: 'Meta_4_Tenang', photo: 'ad4.png',
    hook: 'Bayangkan <span class="c">Tenang</span>nya Tahu Persis Kondisi Keuanganmu.',
    problem: 'Mulai hari ini — dirimu 1 tahun lagi akan berterima kasih. 🌱',
    benefits: [
      'Semua keuangan rapi dalam 1 aplikasi',
      'Buka di HP & laptop, simpel, Bahasa Indonesia',
      'Sekali bayar Rp49.900 — akses selamanya',
    ],
  },
]

function html(ad, b64) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
.ad{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif;
  background:#251014 url('data:image/png;base64,${b64}') center/cover no-repeat}
.ad::before{content:'';position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(37,16,20,.86) 0%,rgba(37,16,20,.30) 26%,rgba(37,16,20,.05) 42%,rgba(37,16,20,.45) 60%,rgba(37,16,20,.93) 82%,rgba(37,16,20,.99) 100%)}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:56px 58px 52px;z-index:2}
.brand{display:inline-flex;align-items:center;gap:13px;align-self:flex-start;background:rgba(244,241,235,.14);backdrop-filter:blur(6px);
  border:1.5px solid rgba(244,241,235,.34);border-radius:999px;padding:10px 22px 10px 11px}
.brand .badge{width:36px;height:36px;border-radius:10px;background:linear-gradient(150deg,#72283A,#33181C);color:#fff;
  font-family:'Instrument Serif',serif;font-size:23px;display:flex;align-items:center;justify-content:center}
.brand b{font-family:'Instrument Serif',serif;font-weight:400;color:#fff;font-size:30px;letter-spacing:.3px}
.top{display:flex;flex-direction:column;gap:24px}
.hook{font-family:'Instrument Serif',serif;font-weight:400;color:#F4F1EB;font-size:84px;line-height:1.03;letter-spacing:-.5px;
  text-shadow:0 4px 26px rgba(0,0,0,.55);max-width:940px}
.hook .c{color:#E6C079;font-style:italic}.hook .r{color:#E79B86;font-style:italic}
.bottom{display:flex;flex-direction:column;gap:22px}
.problem{font-size:33px;line-height:1.32;color:#EFEAE2;font-weight:600;text-shadow:0 2px 12px rgba(0,0,0,.6);max-width:920px}
.bens{display:flex;flex-direction:column;gap:14px}
.ben{display:flex;align-items:flex-start;gap:15px;font-size:31px;font-weight:600;color:#F4F1EB;line-height:1.26;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.ben .ck{flex-shrink:0;width:40px;height:40px;border-radius:11px;background:#B08968;color:#2A1B20;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:800;margin-top:1px}
.value{align-self:flex-start;background:rgba(244,241,235,.13);backdrop-filter:blur(6px);border:1.5px solid rgba(244,241,235,.30);
  border-radius:14px;padding:14px 24px;color:#F4F1EB;font-weight:600;font-size:25px;letter-spacing:.2px}
.cta{align-self:stretch;background:linear-gradient(100deg,#C9A98A,#E6C079);color:#2A1308;font-weight:800;font-size:37px;line-height:1.14;
  padding:26px 36px;border-radius:20px;box-shadow:0 16px 34px -8px rgba(0,0,0,.6);text-align:center}
.foot{font-size:23px;color:rgba(244,241,235,.82);font-weight:600;letter-spacing:.3px;text-align:center}
</style></head>
<body><div class="ad"><div class="wrap">
  <div class="top">
    <div class="brand"><span class="badge">F</span><b>Finplan Sanka</b></div>
    <div class="hook">${ad.hook}</div>
  </div>
  <div class="bottom">
    <div class="problem">${ad.problem}</div>
    <div class="bens">${ad.benefits.map(b => `<div class="ben"><span class="ck">✓</span><span>${b}</span></div>`).join('')}</div>
    <div class="value">${VALUE}</div>
    <div class="cta">${CTA}</div>
    <div class="foot">Finplan Sanka · Catatan keuangan pribadi yang simpel</div>
  </div>
</div></div></body></html>`
}

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  for (const ad of ADS) {
    const p = path.join(PDIR, ad.photo)
    if (!fs.existsSync(p)) { console.error('MISSING photo ' + ad.photo); process.exit(1) }
    const b64 = fs.readFileSync(p).toString('base64')
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
    await page.setContent(html(ad, b64), { waitUntil: 'networkidle0', timeout: 60000 })
    try { await page.evaluateHandle('document.fonts.ready') } catch (e) {}
    await new Promise(r => setTimeout(r, 700))
    const out = path.join(OUT, ad.file + '.png')
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } })
    console.log('saved ' + out)
    await page.close()
  }
  await browser.close()
  console.log('\nDONE 4 ads → ' + OUT)
})().catch(e => { console.error('FATAL', e); process.exit(1) })
