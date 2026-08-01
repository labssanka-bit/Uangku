/**
 * Dialog global — pengganti window.confirm/alert bawaan browser.
 * Bisa dipanggil dari mana saja (termasuk file non-React), asalkan
 * <DialogHost /> sudah dipasang. Kalau belum, jatuh ke dialog bawaan.
 */

export type DialogTone = 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmOptions {
  title: string
  /** Paragraf pembuka. */
  message?: string
  /** Poin-poin dampak (ditampilkan sebagai daftar bertanda). */
  bullets?: string[]
  /** Catatan kecil di bawah, mis. saran alternatif yang lebih aman. */
  note?: string
  confirmText?: string
  cancelText?: string
  tone?: DialogTone
}

export interface AlertOptions {
  title: string
  message?: string
  tone?: DialogTone
  confirmText?: string
}

export interface ToastItem {
  id: number
  message: string
  tone: DialogTone
}

interface Handlers {
  confirm: (o: ConfirmOptions) => Promise<boolean>
  alert: (o: AlertOptions) => Promise<void>
  toast: (message: string, tone?: DialogTone) => void
}

let handlers: Handlers | null = null

/** Dipanggil sekali oleh <DialogHost />. */
export function registerDialogHandlers(h: Handlers | null) {
  handlers = h
}

function plainText(o: ConfirmOptions | AlertOptions): string {
  const parts = [o.title]
  if (o.message) parts.push('', o.message)
  const b = (o as ConfirmOptions).bullets
  if (b?.length) parts.push('', ...b.map((x) => `• ${x}`))
  const n = (o as ConfirmOptions).note
  if (n) parts.push('', n)
  return parts.join('\n')
}

/** Konfirmasi ya/tidak. Selalu await hasilnya. */
export function confirmDialog(o: ConfirmOptions): Promise<boolean> {
  if (handlers) return handlers.confirm(o)
  return Promise.resolve(window.confirm(plainText(o)))
}

/** Pemberitahuan satu tombol. */
export function alertDialog(o: AlertOptions): Promise<void> {
  if (handlers) return handlers.alert(o)
  window.alert(plainText(o))
  return Promise.resolve()
}

/** Notifikasi singkat melayang (untuk sukses/info ringan, tanpa memblokir). */
export function toast(message: string, tone: DialogTone = 'success') {
  if (handlers) handlers.toast(message, tone)
  else window.alert(message)
}

/** Pintasan pesan gagal yang konsisten. */
export function errorDialog(judul: string, e: unknown) {
  const pesan = e instanceof Error ? e.message : (e as { message?: string })?.message || 'Terjadi kesalahan tak terduga.'
  return alertDialog({ title: judul, message: pesan, tone: 'danger' })
}
