/** Voice note → teks via Web Speech API (gratis, on-device, id-ID). */

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
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

const ERROR_MAP: Record<string, string> = {
  'not-allowed': 'Izinkan akses mikrofon di browser, lalu coba lagi.',
  'no-speech': 'Tidak ada suara terdeteksi. Coba ucapkan lebih keras.',
  'network': 'Perlu koneksi internet untuk fitur suara.',
  'aborted': 'Rekaman dibatalkan.',
  'audio-capture': 'Mikrofon tidak ditemukan di perangkat.',
  'service-not-allowed': 'Izin mikrofon ditolak. Aktifkan di pengaturan browser.',
  'language-not-supported': 'Bahasa id-ID tidak didukung browser ini.',
}

function getRecognition(): SpeechRecognitionLike | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
  return Ctor ? new Ctor() : null
}

export function isVoiceSupported(): boolean {
  return getRecognition() !== null
}

/** Rekam sekali ucapan, kembalikan transkrip. */
export function listenOnce(): Promise<string> {
  return new Promise((resolve, reject) => {
    const rec = getRecognition()
    if (!rec) return reject(new Error('Browser tidak mendukung input suara. Gunakan Chrome.'))
    rec.lang = 'id-ID'
    rec.interimResults = false
    rec.maxAlternatives = 1
    let result = ''
    let settled = false
    rec.onresult = (e) => {
      result = e.results[0][0].transcript
    }
    rec.onerror = (e) => {
      if (settled) return
      settled = true
      reject(new Error(ERROR_MAP[e.error] ?? e.error ?? 'Gagal merekam suara.'))
    }
    rec.onend = () => {
      if (settled) return
      settled = true
      resolve(result)
    }
    try {
      rec.start()
    } catch {
      settled = true
      reject(new Error('Gagal memulai rekaman. Pastikan izin mikrofon aktif.'))
    }
  })
}
