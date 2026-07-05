import { useEffect, useState, type ReactNode } from 'react'
import {
  Smartphone, Share, MoreVertical, CheckCircle2, Plus, Camera, Mic,
  Landmark, PiggyBank, Gem, HandCoins, BarChart3, Repeat, ArrowLeftRight,
  Palette, MessageCircle, Download,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'

interface BIPEvent extends Event { prompt: () => void; userChoice: Promise<{ outcome: string }> }

export function Panduan() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(
    (window as unknown as { __deferredInstallPrompt?: BIPEvent }).__deferredInstallPrompt ?? null
  )
  const installed =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true

  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BIPEvent)
    }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])

  async function install() {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    ;(window as unknown as { __deferredInstallPrompt?: BIPEvent | null }).__deferredInstallPrompt = null
  }

  return (
    <div className="px-4 pt-5">
      <PageHeader title="Panduan" />

      <p className="mb-4 text-sm text-gray-500">
        Selamat datang di <b className="text-maroon-700 dark:text-dusty-200">Finplan Sanka</b> 👋
        Ini panduan singkat biar kamu langsung lancar pakai aplikasinya.
      </p>

      {/* ── PASANG JADI APLIKASI ── */}
      <Card className="mb-4 border border-maroon-100 bg-gradient-to-br from-maroon-50 to-white dark:border-maroon-900/40 dark:from-maroon-900/20 dark:to-transparent">
        <div className="mb-2 flex items-center gap-2">
          <Smartphone size={20} className="text-maroon-700 dark:text-dusty-200" />
          <h2 className="text-base font-bold text-maroon-800 dark:text-dusty-200">Pasang Jadi Aplikasi di HP</h2>
        </div>
        <p className="mb-3 text-sm text-gray-500">
          Biar buka <b>sekali tap</b> dari layar HP — <b>tanpa buka browser dulu</b>, dan tampil penuh seperti aplikasi biasa.
        </p>

        {installed ? (
          <div className="flex items-center gap-2 rounded-xl bg-sage-50 px-3 py-3 text-sm font-semibold text-sage-700 dark:bg-sage-500/10">
            <CheckCircle2 size={18} /> Aplikasi sudah terpasang. Mantap! 🎉
          </div>
        ) : (
          <>
            {deferred && (
              <button
                onClick={install}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-maroon-700 py-3 font-bold text-white shadow-soft"
              >
                <Download size={18} /> Pasang Sekarang (1 tap)
              </button>
            )}
            <div className="space-y-3">
              <div className="rounded-xl bg-white p-3 dark:bg-gray-900/60">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-bold">🤖 Android (Chrome)</p>
                <ol className="ml-1 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex gap-2"><span className="font-bold text-maroon-700">1.</span> Tap menu <MoreVertical size={14} className="inline" /> (titik tiga) di kanan atas</li>
                  <li className="flex gap-2"><span className="font-bold text-maroon-700">2.</span> Pilih <b>“Tambahkan ke Layar utama”</b> / “Instal aplikasi”</li>
                  <li className="flex gap-2"><span className="font-bold text-maroon-700">3.</span> Tap <b>Tambah</b> — ikon Finplan muncul di layar HP</li>
                </ol>
              </div>
              <div className="rounded-xl bg-white p-3 dark:bg-gray-900/60">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-bold">🍎 iPhone (Safari)</p>
                <ol className="ml-1 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex gap-2"><span className="font-bold text-maroon-700">1.</span> Tap ikon <b>Bagikan</b> <Share size={14} className="inline" /> di bawah</li>
                  <li className="flex gap-2"><span className="font-bold text-maroon-700">2.</span> Pilih <b>“Tambahkan ke Layar Utama”</b></li>
                  <li className="flex gap-2"><span className="font-bold text-maroon-700">3.</span> Tap <b>Tambah</b> — selesai!</li>
                </ol>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-gray-400">Setelah terpasang, buka Finplan lewat ikon di layar HP ya, bukan dari browser lagi 😊</p>
          </>
        )}
      </Card>

      <h2 className="mb-2 mt-6 px-1 font-bold text-gray-700 dark:text-gray-200">Cara Pakai</h2>

      <div className="space-y-3">
        <Step icon={Plus} title="Catat Transaksi" tint="#5C1A2B">
          Tap tombol <b>+</b> di tengah bawah → isi nominal, pilih <b>kategori</b> &amp; <b>dompet</b> → <b>Simpan</b>.
          Mau lebih cepat? Tap <Camera size={13} className="inline" /> <b>foto struk</b> (dibaca AI otomatis) atau
          <Mic size={13} className="inline" /> <b>rekam suara</b> (“kopi tiga puluh ribu”).
        </Step>

        <Step icon={Landmark} title="Dompet & Saldo Awal" tint="#3E7A66">
          Buat dompet (Cash, Bank, e-wallet) di menu <b>Dompet</b>. Isi <b>Saldo Awal</b> = jumlah uangmu <b>sekarang</b>.
          Setelah itu tiap transaksi otomatis menambah/mengurangi saldo.
        </Step>

        <Step icon={PiggyBank} title="Anggaran" tint="#B23A48">
          Atur <b>batas belanja</b> tiap kategori. Anggaran otomatis <b>sama tiap bulan</b> (bisa diubah kapan saja).
          Warnanya berubah saat mendekati/melewati batas.
        </Step>

        <Step icon={Gem} title="Aset" tint="#C9A86A">
          Catat <b>emas, saham, properti</b>, dll. Aplikasi hitung <b>untung/rugi</b> &amp; <b>total kekayaan</b>-mu.
          Ada rekap terpisah per jenis (Emas, Saham, …).
        </Step>

        <Step icon={HandCoins} title="Hutang & Piutang" tint="#8b5cf6">
          Catat utang atau uang yang dipinjam orang, biar tidak lupa siapa &amp; berapa.
        </Step>

        <Step icon={BarChart3} title="Statistik" tint="#3E7A66">
          Lihat <b>grafik arus kas</b> &amp; ke mana uangmu pergi tiap bulan — biar gampang evaluasi.
        </Step>

        <Step icon={Repeat} title="Transaksi Berulang" tint="#5C1A2B">
          Untuk yang rutin (gaji, langganan, cicilan) — set sekali, otomatis tercatat tiap jatuh tempo.
        </Step>

        <Step icon={ArrowLeftRight} title="Transfer Antar Dompet" tint="#3E7A66">
          Pindah uang antar dompet (mis. tarik tunai) tanpa dihitung sebagai pengeluaran.
        </Step>

        <Step icon={Palette} title="Tampilan & Privasi" tint="#C9A86A">
          Ganti <b>tema warna</b> (17 pilihan) &amp; <b>mode gelap</b> di menu <b>Setting</b>.
          Tap ikon mata di Beranda untuk <b>sembunyikan angka</b> saat di tempat umum.
        </Step>

        <Step icon={MessageCircle} title="Butuh Bantuan?" tint="#B23A48">
          Tap tombol chat bulat di kanan bawah — pesanmu langsung sampai ke admin. Kami bantu 🙏
        </Step>
      </div>

      <p className="mb-2 mt-6 text-center text-xs text-gray-400">
        Selamat mengatur keuangan! Konsisten catat tiap hari = kunci utamanya 🌱
      </p>
    </div>
  )
}

function Step({ icon: Icon, title, tint, children }: { icon: typeof Plus; title: string; tint: string; children: ReactNode }) {
  return (
    <Card className="flex gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: tint + '1f', color: tint }}>
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{children}</p>
      </div>
    </Card>
  )
}
