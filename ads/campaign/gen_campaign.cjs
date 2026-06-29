/* Kampanye "Gaji Hilang Misterius" — 3 static + carousel 5 kartu. 1080x1350.
   Playfair Display + Inter. Palet maroon/cream/gold. Foto Higgsfield embed base64.
   Run: node gen_campaign.cjs  (butuh Chrome) → out/ */
const puppeteer = require('puppeteer-core')
const fs = require('fs')
const path = require('path')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PD = path.join(__dirname, 'photos')
const OUT = path.join(__dirname, 'out')
fs.mkdirSync(OUT, { recursive: true })
const b64 = (p) => fs.readFileSync(p).toString('base64')
const photo = (f) => `data:image/png;base64,${b64(path.join(PD, f))}`
const LOGO = `data:image/png;base64,${b64(path.join(__dirname, '..', '..', 'public', 'logo-mark.png'))}`
const CTA = 'Ambil Kendali Keuanganmu — Mulai Hari Ini →'
const FOOT = 'Finplan Sanka · Catatan keuangan pribadi yang simpel'

const HEAD = `<meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,800;0,900;1,600;1,700;1,800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{--maroon:#5C1A2B;--maroon-d:#3E1320;--cream:#F2ECE2;--gold:#C9A86A;--gold-l:#E2C892;--ink:#2B1712}
.c{position:relative;width:1080px;height:1350px;overflow:hidden;font-family:'Inter',sans-serif}
.serif{font-family:'Playfair Display',serif}
.logo{display:inline-flex;align-items:center;gap:14px}
.logo img{width:60px;height:60px;border-radius:15px;box-shadow:0 6px 16px rgba(0,0,0,.3)}
.logo b{font-family:'Playfair Display',serif;font-weight:800;font-size:30px}
.cta{display:flex;align-items:center;justify-content:center;background:linear-gradient(100deg,var(--cream),var(--gold-l));
  color:var(--maroon-d);font-weight:800;font-size:33px;padding:26px 30px;border-radius:18px;text-align:center;
  box-shadow:0 16px 34px -10px rgba(0,0,0,.5);font-family:'Inter'}
.foot{font-size:21px;font-weight:500;letter-spacing:.2px}
.peek{position:absolute;right:-30px;top:50%;transform:translateY(-50%);width:80px;height:80px;border-radius:50%;
  background:var(--gold);display:flex;align-items:center;justify-content:center;color:var(--maroon-d);font-size:38px;
  font-weight:800;box-shadow:0 8px 20px rgba(0,0,0,.35);z-index:5;padding-right:24px}

/* STATIC (foto bleed) */
.ph{position:absolute;inset:0;background:#3E1320 center/cover no-repeat}
.ph::before{content:'';position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(62,19,32,.92) 0%,rgba(62,19,32,.45) 22%,rgba(62,19,32,.05) 40%,rgba(62,19,32,.55) 60%,rgba(62,19,32,.95) 82%,rgba(62,19,32,.99) 100%)}
.wrap{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:space-between;padding:60px 58px 54px;z-index:2}
.logo.light b{color:var(--cream)}
.head{font-family:'Playfair Display',serif;font-weight:800;color:var(--cream);font-size:76px;line-height:1.04;
  letter-spacing:-.5px;text-shadow:0 4px 24px rgba(0,0,0,.5);margin-top:26px}
.head i{font-style:italic;color:var(--gold-l)}
.bottom{display:flex;flex-direction:column;gap:22px}
.sub{font-size:31px;line-height:1.32;color:#F0E6D8;font-weight:600;text-shadow:0 2px 10px rgba(0,0,0,.6)}
.bens{background:rgba(242,236,226,.12);border:1.5px solid rgba(242,236,226,.25);border-radius:20px;padding:22px 24px;
  display:flex;flex-direction:column;gap:14px;backdrop-filter:blur(4px)}
.ben{display:flex;align-items:center;gap:14px;font-size:28px;font-weight:600;color:var(--cream)}
.ben .ck{flex-shrink:0;width:38px;height:38px;border-radius:10px;background:var(--gold);color:var(--maroon-d);
  display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800}
.foot.light{color:rgba(242,236,226,.78)}

/* CARD bg variants */
.bg-maroon{background:radial-gradient(700px 460px at 80% 8%,rgba(201,168,106,.22),transparent),linear-gradient(160deg,var(--maroon),var(--maroon-d))}
.bg-cream{background:var(--cream)}
.cwrap{position:absolute;inset:0;display:flex;flex-direction:column;padding:64px 60px 58px;z-index:2}
.kicker{font-size:22px;font-weight:700;letter-spacing:.18em;text-transform:uppercase}
.chead{font-family:'Playfair Display',serif;font-weight:800;line-height:1.05;letter-spacing:-.5px}
.chead i{font-style:italic}
</style>`

function staticAd({ photoFile, head, sub, bens }) {
  return `<!DOCTYPE html><html><head>${HEAD}</head><body>
  <div class="c"><div class="ph" style="background-image:url('${photo(photoFile)}')"></div>
    <div class="wrap">
      <div><div class="logo light"><img src="${LOGO}"><b>Finplan Sanka</b></div>
        <div class="head">${head}</div></div>
      <div class="bottom">
        <div class="sub">${sub}</div>
        <div class="bens">${bens.map(b => `<div class="ben"><span class="ck">✓</span><span>${b}</span></div>`).join('')}</div>
        <div class="cta">${CTA}</div>
        <div class="foot light">${FOOT}</div>
      </div>
    </div>
  </div></body></html>`
}

const logoSmall = (dark) => `<div class="logo" style="gap:11px"><img src="${LOGO}" style="width:44px;height:44px;border-radius:12px"><b class="serif" style="font-size:24px;color:${dark ? 'var(--cream)' : 'var(--maroon)'}">Finplan Sanka</b></div>`

// Carousel cards
const CARDS = {
  k1: () => `<div class="c"><div class="ph" style="background-image:url('${photo('foto_carousel_penasaran.png')}')"></div>
    <div class="cwrap" style="justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:center">${logoSmall(true)}<span style="color:var(--gold-l);font-weight:700;font-size:22px">1 / 5</span></div>
      <div class="chead" style="color:var(--cream);font-size:82px;text-shadow:0 4px 24px rgba(0,0,0,.55);max-width:900px">Coba Hitung: <i style="color:var(--gold-l)">Ke Mana</i> Uangmu Bulan Ini?</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <span class="foot light" style="color:rgba(242,236,226,.8)">${FOOT}</span>
        <span class="serif" style="color:var(--gold-l);font-size:30px;font-weight:700">Geser →</span>
      </div>
    </div><div class="peek">›</div></div>`,

  k2: () => `<div class="c bg-cream">
    <div class="cwrap" style="justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:center">${logoSmall(false)}<span style="color:var(--gold);font-weight:700;font-size:22px">2 / 5</span></div>
      <div>
        <div class="kicker" style="color:var(--gold)">Yang receh itu…</div>
        <div class="chead" style="color:var(--maroon);font-size:72px;margin-top:14px">Kopi 25rb. Ongkir 10rb. Jajan 15rb.</div>
        <div style="display:flex;gap:14px;margin-top:34px">
          ${[['☕', 'Kopi'], ['🛵', 'Ongkir'], ['🍢', 'Jajan'], ['🧾', '…dst']].map(([e, t]) => `<div style="flex:1;background:#fff;border:1px solid #e5dccd;border-radius:18px;padding:20px 8px;text-align:center"><div style="font-size:40px">${e}</div><div style="font-size:18px;color:#7a5a4a;font-weight:600;margin-top:6px">${t}</div></div>`).join('')}
        </div>
        <div style="margin-top:34px;background:var(--maroon);border-radius:22px;padding:30px;text-align:center">
          <div style="color:#E9D9C2;font-size:24px;font-weight:600">Sebulan, tanpa terasa…</div>
          <div class="serif" style="color:var(--gold-l);font-size:78px;font-weight:900;line-height:1.1">Rp1,2 juta lenyap</div>
        </div>
      </div>
      <span class="foot" style="color:#9a8676">Geser → lihat kenapa ini terjadi</span>
    </div><div class="peek">›</div></div>`,

  k3: () => `<div class="c bg-maroon">
    <div class="cwrap" style="justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:center">${logoSmall(true)}<span style="color:var(--gold-l);font-weight:700;font-size:22px">3 / 5</span></div>
      <div>
        <div class="kicker" style="color:var(--gold-l)">Faktanya</div>
        <div class="chead" style="color:var(--cream);font-size:70px;margin-top:14px;max-width:920px">Masalahnya bukan kamu <i style="color:var(--gold-l)">boros</i>. Kamu cuma nggak <i style="color:var(--gold-l)">lihat polanya</i>.</div>
        <div style="margin-top:30px;background:rgba(242,236,226,.1);border:1.5px solid rgba(242,236,226,.22);border-radius:20px;padding:26px">
          ${[['Belanja', 88], ['Makanan', 60], ['Lainnya', 38]].map(([n, w]) => `<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;color:#EAD9C2;font-size:22px;font-weight:600;margin-bottom:8px"><span>${n}</span><span>Rp ••••</span></div><div style="height:14px;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden"><i style="display:block;height:100%;width:${w}%;background:var(--gold)"></i></div></div>`).join('')}
        </div>
      </div>
      <span class="serif" style="color:#E9D9C2;font-size:30px;font-style:italic">"Yang nggak keukur, nggak bisa dikendalikan."</span>
    </div><div class="peek">›</div></div>`,

  k4: () => `<div class="c bg-cream">
    <div class="cwrap" style="justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:center">${logoSmall(false)}<span style="color:var(--gold);font-weight:700;font-size:22px">4 / 5</span></div>
      <div>
        <div class="kicker" style="color:var(--gold)">Solusinya</div>
        <div class="chead" style="color:var(--maroon);font-size:66px;margin-top:14px">Finplan Sanka bikin semuanya <i>kelihatan</i>.</div>
        <div style="margin-top:26px;display:flex;flex-direction:column;gap:14px">
          ${['Catat 3 detik — foto struk (AI) & suara', 'Rekap per kategori + insight otomatis', 'Tahu “uang aman harian” tiap hari'].map(b => `<div style="display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e5dccd;border-radius:16px;padding:18px 20px;font-size:26px;font-weight:600;color:var(--maroon)"><span style="width:36px;height:36px;border-radius:10px;background:var(--maroon);color:var(--cream);display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0">✓</span>${b}</div>`).join('')}
        </div>
      </div>
      <div style="background:var(--maroon);border-radius:22px;padding:22px 26px;display:flex;justify-content:space-between;align-items:center">
        <div><div style="color:#E9D9C2;font-size:20px">Total Saldo · privasi</div><div class="serif" style="color:var(--cream);font-size:40px;font-weight:800">Rp ••••••••</div></div>
        <div style="display:flex;gap:8px;align-items:flex-end;height:70px">${[40, 64, 34, 80, 52].map((h, i) => `<span style="width:18px;height:${h}%;border-radius:5px;background:${i % 2 ? '#9C5B4E' : 'var(--gold)'}"></span>`).join('')}</div>
      </div>
    </div><div class="peek">›</div></div>`,

  k5: () => `<div class="c bg-maroon">
    <div class="cwrap" style="justify-content:space-between;text-align:center;align-items:center">
      <div style="display:flex;justify-content:space-between;align-items:center;width:100%">${logoSmall(true)}<span style="color:var(--gold-l);font-weight:700;font-size:22px">5 / 5</span></div>
      <div>
        <div class="kicker" style="color:var(--gold-l)">Penawaran</div>
        <div class="chead" style="color:var(--cream);font-size:64px;margin-top:16px">Sekali Bayar <i style="color:var(--gold-l)">Rp49.900</i>.<br>Akses Selamanya.</div>
        <div style="color:#E9D9C2;font-size:28px;font-weight:600;margin-top:18px">Tanpa langganan. HP &amp; laptop, full Bahasa Indonesia.</div>
      </div>
      <div style="width:100%">
        <div class="cta" style="width:100%">${CTA}</div>
        <div class="foot light" style="color:rgba(242,236,226,.8);margin-top:18px">${FOOT}</div>
      </div>
    </div></div>`,
}

const JOBS = [
  ['Ads1_GajiNumpangLewat', staticAd({
    photoFile: 'foto_ads1_bingung.png',
    head: 'Gajian Numpang Lewat. Tanggal 15 Udah Bingung <i>Sisa Berapa</i>.',
    sub: 'Uang habis sebelum akhir bulan — tanpa terasa, tanpa jejak.',
    bens: ['Catat cepat 3 detik — foto struk & suara', 'Tahu sisa uang real-time', 'Full Bahasa Indonesia · HP & laptop'],
  })],
  ['Ads2_NggakAdaSisa', staticAd({
    photoFile: 'foto_ads2_termenung.png',
    head: 'Punya Pemasukan. Tapi Kok <i>Nggak Pernah</i> Ada Sisa?',
    sub: 'Bukan soal penghasilan kecil — kamu cuma nggak tahu uang lari ke mana.',
    bens: ['Rekap per kategori otomatis', 'Insight cerdas tiap bulan', 'Cuma Rp49.900 — selamanya'],
  })],
  ['Ads3_Reframe', staticAd({
    photoFile: 'foto_ads3_lega.png',
    head: 'Bukan Gaji Kecil. Kamu Cuma Nggak Tahu <i>Uangnya ke Mana</i>.',
    sub: 'Temukan kebocoran kecil yang selama ini nggak pernah terlihat.',
    bens: ['Lihat pola pengeluaran yang nggak kamu sadari', 'Tahu “uang aman harian” tiap hari', 'Sekali bayar — akses selamanya'],
  })],
  ['Carousel_1_Hook', `<!DOCTYPE html><html><head>${HEAD}</head><body>${CARDS.k1()}</body></html>`],
  ['Carousel_2_Agitasi', `<!DOCTYPE html><html><head>${HEAD}</head><body>${CARDS.k2()}</body></html>`],
  ['Carousel_3_Reframe', `<!DOCTYPE html><html><head>${HEAD}</head><body>${CARDS.k3()}</body></html>`],
  ['Carousel_4_Solusi', `<!DOCTYPE html><html><head>${HEAD}</head><body>${CARDS.k4()}</body></html>`],
  ['Carousel_5_Offer', `<!DOCTYPE html><html><head>${HEAD}</head><body>${CARDS.k5()}</body></html>`],
]

;(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] })
  for (const [name, htmlContent] of JOBS) {
    const html = htmlContent.startsWith('<!DOCTYPE') ? htmlContent : `<!DOCTYPE html><html><head>${HEAD}</head><body>${htmlContent}</body></html>`
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })
    try { await page.evaluateHandle('document.fonts.ready') } catch (e) {}
    await new Promise(r => setTimeout(r, 650))
    await page.screenshot({ path: path.join(OUT, name + '.png'), clip: { x: 0, y: 0, width: 1080, height: 1350 } })
    console.log('saved ' + name)
    await page.close()
  }
  await browser.close()
  console.log('\nDONE 8 kreatif → ' + OUT)
})().catch(e => { console.error('FATAL', e); process.exit(1) })
