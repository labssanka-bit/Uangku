/** Voice note → teks via Web Speech API (gratis, on-device, id-ID). */

// Tipe minimal (Web Speech API belum di lib dom standar TS)
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
    if (!rec) return reject(new Error('Browser tidak mendukung input suara.'))
    rec.lang = 'id-ID'
    rec.interimResults = false
    rec.maxAlternatives = 1
    let result = ''
    rec.onresult = (e) => {
      result = e.results[0][0].transcript
    }
    rec.onerror = (e) => reject(new Error(e.error || 'Gagal merekam suara.'))
    rec.onend = () => resolve(result)
    rec.start()
  })
}
