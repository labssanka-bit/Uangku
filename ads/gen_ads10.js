/* ============================================================
   10 KONTEN META ADS — Finplan Sanka (multi-gaya).
   Layout: 'product' (mockup app CSS), 'ill' (ilustrasi), 'photo' (foto realistik).
   Palette editorial Finplan + Instrument Serif. Output 1080x1350 → ads/out/.
   Run: node gen_ads10.js  (butuh Chrome + ads/photos/*)
   ============================================================ */
const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PDIR = path.join(__dirname, 'photos')
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })

const CTA = 'Ambil Kendali Keuanganmu — Mulai Hari Ini →'
const b64 = (f) => fs.readFileSync(path.join(PDIR, f)).toString('base64')

const ADS = [
  // ── ILUSTRASI ──
  { file: 'Meta_01_Ill_Gaji', layout: 'ill', img: 'ill1.png',
    hook: 'Gaji <span class="c">Numpang Lewat?</span>',
    sub: 'Tiap akhir bulan cuma bisa bertanya: “kok udah habis lagi?”',
    bens: ['Tahu “uang aman harian” tiap hari', 'Catat 3 detik: foto struk / suara'] },
  { file: 'Meta_02_Ill_Receh', layout: 'ill', img: 'ill2.png',
    hook: 'Receh Tiap Hari = <span class="c">Jutaan</span> Setahun.',
    sub: 'Yang kelihatan kecil, diam-diam numpuk jadi besar di akhir bulan.',
    bens: ['Rekap per kategori bikin pola kelihatan', 'Insight otomatis “naik 20% dari bln lalu”'] },
  { file: 'Meta_03_Ill_Tumbuh', layout: 'ill', img: 'ill3.png',
    hook: 'Uang Receh Hari Ini, <span class="c">Aset</span> Esok Hari.',
    sub: 'Harga terus naik. Yang didiamkan menyusut — yang diatur, bertumbuh.',
    bens: ['Bangun tabungan & dana darurat terukur', 'Pantau emas & aset, harga terkini'] },
  // ── PRODUK (mockup) ──
  { file: 'Meta_04_Produk_Dashboard', layout: 'product', screen: 'dash',
    hook: 'Semua Keuanganmu, dalam <span class="c">1 Layar.</span>',
    sub: 'Saldo, pemasukan, pengeluaran, grafik — langsung kelihatan.' },
  { file: 'Meta_05_Produk_Catat', layout: 'product', screen: 'dash',
    hook: 'Catat Transaksi Cuma <span class="c">3 Detik.</span>',
    sub: 'Ketik, foto struk (AI), atau tinggal ngomong. Sesimpel itu.' },
  { file: 'Meta_06_Produk_Insight', layout: 'product', screen: 'stat',
    hook: 'Tahu Persis Uangmu <span class="c">Lari ke Mana.</span>',
    sub: 'Rekap per kategori + insight cerdas otomatis tiap bulan.' },
  { file: 'Meta_07_Produk_Lengkap', layout: 'product', screen: 'dash',
    hook: 'Dompet, Hutang, <span class="c">Emas</span> — Lengkap.',
    sub: 'Semua kebutuhan keuanganmu rapi dalam satu aplikasi.' },
  // ── FOTO realistik ──
  { file: 'Meta_08_Foto_Tenang', layout: 'photo', img: 'ph1.png',
    hook: 'Akhir Bulan Nggak <span class="c">Deg-Degan</span> Lagi.',
    sub: 'Tahu sisa uang, tabungan tumbuh, semua jelas ke mana. 🌱',
    bens: ['Tahu “uang aman harian” tiap hari', 'Semua keuangan rapi dalam 1 app', 'Sekali bayar — akses selamanya'] },
  { file: 'Meta_09_Foto_BadMood', layout: 'photo', img: 'ph2.png',
    hook: 'Checkout Pas <span class="c">Bad Mood</span>, Nyesel Pas Liat Saldo.',
    sub: 'Pengeluaran “receh” tiap hari diam-diam numpuk jadi jutaan. 🛒',
    bens: ['Rekap kategori bikin pola kelihatan', 'Insight: “pengeluaran naik 20%”', 'Sadar sebelum saldo bocor'] },
  { file: 'Meta_10_Foto_Mulai', layout: 'photo', img: 'ph3.png',
    hook: 'Mulai Sekarang. Dirimu <span class="c">1 Tahun Lagi</span> Berterima Kasih.',
    sub: 'Harga naik tiap tahun. Makin ditunda, makin jauh dari rasa aman. ☕',
    bens: ['Catat 3 detik, foto struk & suara', 'HP & laptop, full Bahasa Indonesia', 'Cuma Rp49.900, selamanya'] },
]

// ── Mockup layar app (CSS) ──
function screen(kind) {
  if (kind === 'stat') {
    return `<div class="ps-top">Statistik · Bulan Ini</div>
    <div class="prow"><div class="pcard pin"><span>Pemasukan</span><b>Rp ••••</b></div><div class="pcard pex"><span>Pengeluaran</span><b>Rp ••••</b></div></div>
    <div class="pblock"><div class="pbh">Pengeluaran per Kategori</div>
      ${[['Belanja',92,'#9C5B4E'],['Makanan',55,'#72283A'],['Hiburan',30,'#B08968'],['Transport',20,'#6F5F4D']].map(([n,w,c])=>`<div class="catrow"><span>${n}</span><div class="cbar"><i style="width:${w}%;background:${c}"></i></div></div>`).join('')}
    </div>`
  }
  return `<div class="ps-top">Hai, Sanka 👋 <span class="fl">🔥 7 hari</span></div>
  <div class="bal"><small>Total Saldo · 👁</small><div class="big">Rp ••••••••</div>
    <div class="brow"><div><small>Pemasukan</small><br><b>Rp ••••</b></div><div><small>Pengeluaran</small><br><b>Rp ••••</b></div></div></div>
  <div class="mini">${[42,62,34,78,50,90].map((h,i)=>`<span style="height:${h}%;background:${i%2?'#9C5B4E':'#6F5F4D'}"></span>`).join('')}</div>
  <div class="chips"><span>☕ Kopi</span><span>🍔 Makan</span><span>💰 Nabung</span></div>`
}

function phone(kind) {
  return `<div class="phone"><div class="pscreen">${screen(kind)}</div></div>`
}

const HEAD = `<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
.ad{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:'Plus Jakarta Sans',sans-serif}
.serif{font-family:'Instrument Serif',serif;font-weight:400}
.brand{display:inline-flex;align-items:center;gap:12px;align-self:flex-start;border-radius:999px;padding:9px 20px 9px 10px}
.brand .badge{width:34px;height:34px;border-radius:10px;background:linear-gradient(150deg,#72283A,#33181C);color:#fff;font-family:'Instrument Serif',serif;font-size:22px;display:flex;align-items:center;justify-content:center}
.brand b{font-family:'Instrument Serif',serif;font-weight:400;font-size:28px;letter-spacing:.3px}
.cta{font-weight:800;font-size:35px;line-height:1.15;padding:24px 34px;border-radius:18px;text-align:center;box-shadow:0 16px 34px -10px rgba(0,0,0,.45)}
.foot{font-size:22px;font-weight:600;letter-spacing:.3px;text-align:center;opacity:.8}

/* ===== LIGHT (product + ill) ===== */
.light{background:radial-gradient(900px 500px at 80% -5%,rgba(176,137,104,.22),transparent),linear-gradient(180deg,#F7F4EE,#EFEBE3)}
.light .wrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:62px 64px 56px;z-index:2}
.light .brand{background:#fff;border:1.5px solid #DDD9C9;color:#33181C}
.light .hook{font-family:'Instrument Serif',serif;font-weight:400;color:#33181C;font-size:80px;line-height:1.02;letter-spacing:-.5px;margin-top:26px;max-width:920px}
.light .hook .c{font-style:italic;color:#9C5B4E}
.light .sub{font-size:31px;line-height:1.34;color:#6F5F4D;font-weight:600;margin-top:20px;max-width:880px}
.light .cta{background:linear-gradient(100deg,#72283A,#33181C);color:#fff;align-self:stretch;margin-top:auto}
.light .foot{color:#8a7d72;margin-top:16px}
.light .bens{display:flex;flex-direction:column;gap:12px;margin-top:24px}
.light .ben{display:flex;align-items:center;gap:13px;font-size:28px;font-weight:600;color:#33181C}
.light .ben .ck{width:36px;height:36px;border-radius:10px;background:#B08968;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}

/* illustration image */
.illbox{flex:1;display:flex;align-items:center;justify-content:center;margin:18px 0}
.illbox img{max-width:680px;max-height:520px;width:auto;height:auto;border-radius:24px}

/* phone mockup */
.stage{flex:1;display:flex;align-items:center;justify-content:center;margin:8px 0}
.phone{width:430px;border-radius:46px;background:linear-gradient(160deg,#2a1116,#120a0c);padding:13px;box-shadow:0 50px 90px -24px rgba(51,24,28,.5)}
.pscreen{background:#F4EFEA;border-radius:36px;overflow:hidden;padding:26px 22px 30px;min-height:620px}
.ps-top{display:flex;justify-content:space-between;align-items:center;font-size:21px;font-weight:700;color:#33181C}
.fl{background:#fff;border-radius:99px;padding:4px 12px;font-size:15px;color:#B08968}
.bal{background:linear-gradient(135deg,#72283A,#33181C);border-radius:24px;padding:24px;color:#fff;margin-top:16px;position:relative;overflow:hidden}
.bal::after{content:'';position:absolute;width:150px;height:150px;border-radius:50%;background:rgba(226,190,120,.2);top:-60px;right:-40px}
.bal small{opacity:.85;font-size:16px}.bal .big{font-size:42px;font-weight:800;margin-top:4px}
.brow{display:flex;gap:12px;margin-top:18px;position:relative;z-index:1}
.brow div{flex:1;background:rgba(255,255,255,.16);border-radius:15px;padding:12px 14px;font-size:15px}.brow b{font-size:21px}
.mini{display:flex;align-items:flex-end;gap:9px;height:120px;margin-top:20px;padding:0 4px}
.mini span{flex:1;border-radius:7px 7px 0 0}
.chips{display:flex;gap:9px;margin-top:18px;flex-wrap:wrap}
.chips span{background:#fff;border-radius:99px;padding:9px 16px;font-size:16px;font-weight:600;color:#33181C;box-shadow:0 2px 8px rgba(51,24,28,.08)}
.prow{display:flex;gap:12px;margin-top:16px}
.pcard{flex:1;border-radius:18px;padding:16px;font-size:15px;font-weight:600}.pcard b{display:block;font-size:26px;margin-top:4px}
.pin{background:#e7efe9;color:#3E7A66}.pex{background:#f6e7e4;color:#9C5B4E}
.pblock{background:#fff;border-radius:20px;padding:20px;margin-top:16px}
.pbh{font-size:18px;font-weight:700;color:#33181C;margin-bottom:14px}
.catrow{display:flex;align-items:center;gap:12px;margin-bottom:12px;font-size:16px;color:#6F5F4D;font-weight:600}
.catrow span{width:120px}.cbar{flex:1;height:12px;background:#EFEBE3;border-radius:99px;overflow:hidden}.cbar i{display:block;height:100%;border-radius:99px}

/* ===== PHOTO ===== */
.photo{background:#251014 center/cover no-repeat}
.photo::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(37,16,20,.74) 0%,rgba(37,16,20,.18) 24%,rgba(37,16,20,0) 40%,rgba(37,16,20,.45) 58%,rgba(37,16,20,.93) 80%,rgba(37,16,20,.99) 100%)}
.photo .wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:58px 60px 54px;z-index:2}
.photo .brand{background:rgba(244,241,235,.14);border:1.5px solid rgba(244,241,235,.34);color:#fff}
.photo .hook{font-family:'Instrument Serif',serif;font-weight:400;color:#F4F1EB;font-size:82px;line-height:1.03;letter-spacing:-.5px;text-shadow:0 4px 26px rgba(0,0,0,.55);max-width:930px;margin-top:22px}
.photo .hook .c{font-style:italic;color:#E6C079}
.photo .bottom{display:flex;flex-direction:column;gap:20px}
.photo .sub{font-size:32px;line-height:1.32;color:#EFEAE2;font-weight:600;text-shadow:0 2px 12px rgba(0,0,0,.6);max-width:900px}
.photo .bens{display:flex;flex-direction:column;gap:13px}
.photo .ben{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600;color:#F4F1EB;text-shadow:0 2px 8px rgba(0,0,0,.5)}
.photo .ben .ck{width:38px;height:38px;border-radius:11px;background:#B08968;color:#2A1B20;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800}
.photo .cta{background:linear-gradient(100deg,#C9A98A,#E6C079);color:#2A1308;align-self:stretch}
.photo .foot{color:rgba(244,241,235,.82)}
</style>`

function bensHtml(b) { return b && b.length ? `<div class="bens">${b.map(x => `<div class="ben"><span class="ck">✓</span><span>${x}</span></div>`).join('')}</div>` : '' }
const brand = `<div class="brand"><span class="badge">F</span><b>Finplan Sanka</b></div>`

function render(ad) {
  if (ad.layout === 'photo') {
    return `<!DOCTYPE html><html><head>${HEAD}</head><body>
    <div class="ad photo" style="background-image:url('data:image/png;base64,${b64(ad.img)}')"><div class="wrap">
      <div>${brand}<div class="hook">${ad.hook}</div></div>
      <div class="bottom"><div class="sub">${ad.sub}</div>${bensHtml(ad.bens)}
        <div class="cta">${CTA}</div><div class="foot">Finplan Sanka · Catatan keuangan pribadi yang simpel</div></div>
    </div></div></body></html>`
  }
  if (ad.layout === 'ill') {
    return `<!DOCTYPE html><html><head>${HEAD}</head><body>
    <div class="ad light"><div class="wrap">
      ${brand}<div class="hook">${ad.hook}</div>
      <div class="illbox"><img src="data:image/png;base64,${b64(ad.img)}"></div>
      <div class="sub">${ad.sub}</div>${bensHtml(ad.bens)}
      <div class="cta">${CTA}</div><div class="foot">Finplan Sanka · finplansanka.com</div>
    </div></div></body></html>`
  }
  // product
  return `<!DOCTYPE html><html><head>${HEAD}</head><body>
  <div class="ad light"><div class="wrap">
    ${brand}<div class="hook">${ad.hook}</div><div class="sub">${ad.sub}</div>
    <div class="stage">${phone(ad.screen)}</div>
    <div class="cta">${CTA}</div><div class="foot">Finplan Sanka · HP & Laptop · Bahasa Indonesia</div>
  </div></div></body></html>`
}

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  for (const ad of ADS) {
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
    await page.setContent(render(ad), { waitUntil: 'networkidle0', timeout: 60000 })
    try { await page.evaluateHandle('document.fonts.ready') } catch (e) {}
    await new Promise(r => setTimeout(r, 600))
    const out = path.join(OUT, ad.file + '.png')
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: 1350 } })
    console.log('saved ' + ad.file)
    await page.close()
  }
  await browser.close()
  console.log('\nDONE 10 ads → ' + OUT)
})().catch(e => { console.error('FATAL', e); process.exit(1) })
