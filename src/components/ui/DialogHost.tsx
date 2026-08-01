import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Info, CheckCircle2, Trash2, X } from 'lucide-react'
import { registerDialogHandlers, type AlertOptions, type ConfirmOptions, type DialogTone, type ToastItem } from '@/lib/dialog'
import { clsx } from '@/lib/clsx'

type Pending =
  | { kind: 'confirm'; opts: ConfirmOptions; resolve: (v: boolean) => void }
  | { kind: 'alert'; opts: AlertOptions; resolve: () => void }

const TONE: Record<DialogTone, { icon: typeof Info; ring: string; text: string; btn: string }> = {
  danger: {
    icon: Trash2,
    ring: 'bg-wine-50 text-wine-500 dark:bg-wine-500/15',
    text: 'text-wine-500',
    btn: 'bg-wine-500 hover:bg-wine-600',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15',
    text: 'text-amber-600',
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    icon: Info,
    ring: 'bg-dusty-100 text-maroon-700 dark:bg-dusty-500/15 dark:text-dusty-200',
    text: 'text-maroon-700 dark:text-dusty-200',
    btn: 'bg-maroon-700 hover:bg-maroon-800',
  },
  success: {
    icon: CheckCircle2,
    ring: 'bg-sage-100 text-sage-700 dark:bg-sage-500/15',
    text: 'text-sage-700',
    btn: 'bg-sage-600 hover:bg-sage-700',
  },
}

/**
 * Menyediakan dialog & toast bergaya app untuk seluruh aplikasi.
 * Pasang sekali di root — tidak merender apa pun sampai dipanggil.
 */
export function DialogHost() {
  const [pending, setPending] = useState<Pending | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastId = useRef(0)
  const confirmBtn = useRef<HTMLButtonElement>(null)

  const close = useCallback((result: boolean) => {
    setPending((p) => {
      if (!p) return null
      if (p.kind === 'confirm') p.resolve(result)
      else p.resolve()
      return null
    })
  }, [])

  useEffect(() => {
    registerDialogHandlers({
      confirm: (opts) => new Promise<boolean>((resolve) => setPending({ kind: 'confirm', opts, resolve })),
      alert: (opts) => new Promise<void>((resolve) => setPending({ kind: 'alert', opts, resolve })),
      toast: (message, tone = 'success') => {
        const id = ++toastId.current
        setToasts((t) => [...t, { id, message, tone }])
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
      },
    })
    return () => registerDialogHandlers(null)
  }, [])

  // Esc menutup (= batal), Enter menyetujui
  useEffect(() => {
    if (!pending) return
    confirmBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false)
      if (e.key === 'Enter') close(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, close])

  const opts = pending?.opts
  const tone = TONE[opts?.tone ?? 'info']
  const Icon = tone.icon
  const bullets = pending?.kind === 'confirm' ? pending.opts.bullets : undefined
  const note = pending?.kind === 'confirm' ? pending.opts.note : undefined

  return (
    <>
      <AnimatePresence>
        {pending && opts && (
          <>
            <motion.div
              className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => close(false)}
            />
            <div className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white text-left shadow-2xl dark:bg-[#241519]"
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              >
                <div className="max-h-[70dvh] overflow-y-auto overscroll-contain p-6 no-scrollbar">
                  <div className={clsx('mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl', tone.ring)}>
                    <Icon size={26} />
                  </div>
                  <h2 className="text-center text-lg font-extrabold text-maroon-900 dark:text-dusty-100">
                    {opts.title}
                  </h2>
                  {opts.message && (
                    <p className="mt-2 whitespace-pre-line text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      {opts.message}
                    </p>
                  )}
                  {!!bullets?.length && (
                    <ul className="mt-4 space-y-2 rounded-2xl bg-gray-50 p-3.5 dark:bg-white/5">
                      {bullets.map((b, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">
                          <span className={clsx('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', tone.text.replace('text-', 'bg-'))} />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {note && (
                    <p className="mt-3 rounded-2xl bg-dusty-50 p-3 text-center text-[12px] leading-relaxed text-maroon-700 dark:bg-dusty-500/10 dark:text-dusty-200">
                      {note}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 border-t border-gray-100 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/5">
                  {pending.kind === 'confirm' && (
                    <button
                      onClick={() => close(false)}
                      className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-bold text-gray-600 active:scale-[.98] dark:bg-gray-800 dark:text-gray-300"
                    >
                      {pending.opts.cancelText ?? 'Batal'}
                    </button>
                  )}
                  <button
                    ref={confirmBtn}
                    onClick={() => close(true)}
                    className={clsx(
                      'h-12 flex-1 rounded-2xl text-sm font-bold text-white shadow-soft outline-none transition active:scale-[.98]',
                      tone.btn
                    )}
                  >
                    {opts.confirmText ?? (pending.kind === 'confirm' ? 'Lanjutkan' : 'Mengerti')}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Toast melayang */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => {
            const tt = TONE[t.tone]
            const TIcon = tt.icon
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.97 }}
                transition={{ type: 'spring', damping: 26, stiffness: 360 }}
                className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-card dark:bg-[#241519]"
              >
                <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', tt.ring)}>
                  <TIcon size={17} />
                </span>
                <span className="flex-1 text-sm font-semibold text-maroon-900 dark:text-dusty-100">{t.message}</span>
                <button
                  onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
                  className="shrink-0 text-gray-300 active:scale-90"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
