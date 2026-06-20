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

/** Web Speech API stabil (Chrome Android/Desktop). */
export function isWebSpeechSupported(): boolean {
  if (isIOS() || isSafari()) return false
  return getRecognition() !== null
}

/** MediaRecorder tersedia (untuk fallback Gemini di iOS/Safari). */
export function isRecordingSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined'
  )
}

/** Voice note bisa dipakai dgn metode APA PUN (Web Speech atau rekam→Gemini). */
export function isVoiceSupported(): boolean {
  return isWebSpeechSupported() || isRecordingSupported()
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
    } catch {
      clearTimeout(timer)
      settled = true
      reject(new Error('Gagal memulai rekaman. Pastikan izin mikrofon diaktifkan di browser.'))
    }
  })
}

/** MIME audio yang didukung browser (iOS = mp4/aac, lainnya = webm). */
function pickAudioMime(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm'
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg']
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported?.(m)) return m
  }
  return ''
}

export interface RecordedAudio {
  blob: Blob
  mimeType: string
}

/**
 * Rekam audio sekali (otomatis berhenti setelah `maxMs` atau saat stop()).
 * Mengembalikan fungsi stop() yang resolve ke Blob audio.
 * Dipakai di iOS/Safari → dikirim ke Gemini untuk transkrip.
 */
export async function recordAudio(maxMs = 12_000): Promise<{ stop: () => Promise<RecordedAudio> }> {
  if (!isRecordingSupported()) {
    throw new Error('Perangkat tidak mendukung perekaman audio.')
  }
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    throw new Error('Izin mikrofon ditolak. Aktifkan akses mikrofon di pengaturan browser.')
  }

  const mimeType = pickAudioMime()
  const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
  const chunks: BlobPart[] = []
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }
  rec.start()

  let autoStop: ReturnType<typeof setTimeout> | null = setTimeout(() => {
    if (rec.state !== 'inactive') rec.stop()
  }, maxMs)

  const stop = (): Promise<RecordedAudio> =>
    new Promise((resolve) => {
      rec.onstop = () => {
        if (autoStop) { clearTimeout(autoStop); autoStop = null }
        stream.getTracks().forEach((t) => t.stop())
        const type = rec.mimeType || mimeType || 'audio/webm'
        resolve({ blob: new Blob(chunks, { type }), mimeType: type })
      }
      if (rec.state !== 'inactive') rec.stop()
      else stream.getTracks().forEach((t) => t.stop())
    })

  return { stop }
}

/** Blob → base64 (tanpa prefix data URL). */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result)
      resolve(s.includes(',') ? s.split(',')[1] : s)
    }
    r.onerror = reject
    r.readAsDataURL(blob)
  })
}
