/** Voice note → teks via Web Speech API. Hanya stabil di Chrome Android/Desktop. */

interface SpeechRecognitionResultLike {
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

const ERROR_MAP: Record<string, string> = {
  'not-allowed':         'Izin mikrofon ditolak. Ketuk ikon 🔒 di address bar → izinkan Mikrofon.',
  'no-speech':           'Tidak terdengar suara. Bicara lebih dekat ke mikrofon, lalu coba lagi.',
  'network':             'Koneksi internet diperlukan untuk fitur suara.',
  'aborted':             'Rekaman dibatalkan.',
  'audio-capture':       'Mikrofon tidak ditemukan.',
  'service-not-allowed': 'Suara tidak didukung di browser ini. Coba Chrome.',
  'language-not-supported': 'Bahasa id-ID tidak didukung. Coba Chrome.',
  'bad-grammar':         'Tidak dapat mengenali ucapan. Coba lagi.',
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window)
}

function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

/** Cek apakah fitur suara kemungkinan bisa berjalan (bukan jaminan). */
export function isVoiceSupported(): boolean {
  if (isIOS() || isSafari()) return false // tidak stabil
  return getRecognition() !== null
}

/** Rekam sekali ucapan, kembalikan transkrip. Timeout 12 detik. */
export function listenOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (isIOS()) {
      return reject(new Error('iOS Safari tidak mendukung input suara. Gunakan Chrome di Android.'))
    }
    if (isSafari()) {
      return reject(new Error('Safari tidak mendukung input suara. Gunakan Chrome.'))
    }
    const rec = getRecognition()
    if (!rec) {
      return reject(new Error('Browser ini tidak mendukung input suara. Gunakan Chrome di Android.'))
    }

    rec.lang = 'id-ID'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    let result = ''
    let settled = false

    // Timeout otomatis 12 detik → akhiri rekaman
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        try { rec.abort() } catch { /* ignore */ }
        resolve(result || '')
      }
    }, 12_000)

    rec.onresult = (e) => {
      result = e.results[0]?.[0]?.transcript ?? ''
    }

    rec.onerror = (e) => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      reject(new Error(ERROR_MAP[e.error] ?? `Error: ${e.error}`))
    }

    rec.onend = () => {
      clearTimeout(timer)
      if (settled) return
      settled = true
      resolve(result)
    }

    try {
      rec.start()
    } catch (err) {
      clearTimeout(timer)
      settled = true
      reject(new Error('Gagal memulai rekaman. Pastikan izin mikrofon diaktifkan di browser.'))
    }
  })
}
