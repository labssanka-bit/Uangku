import { useEffect, useRef } from 'react'
import { CheckCheck, Check } from 'lucide-react'
import { clsx } from '@/lib/clsx'
import type { SupportMessage } from '@/types'

function timeOf(iso: string) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}
function dateLabel(iso: string) {
  const d = new Date(iso)
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((start(new Date()) - start(d)) / 86_400_000)
  if (diff === 0) return 'Hari ini'
  if (diff === 1) return 'Kemarin'
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(d)
}

/** Daftar pesan gaya WhatsApp: bubble berekor, jam + centang, pemisah tanggal, wallpaper. */
export function ChatThread({
  messages,
  meSide,
  emptyHint,
}: {
  messages: SupportMessage[]
  meSide: 'admin' | 'user'
  emptyHint?: string
}) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  let lastDate = ''
  return (
    <div
      className="flex-1 overflow-y-auto bg-[#ece5df] px-3 py-2 no-scrollbar dark:bg-[#0e0b0c]"
      style={{
        backgroundImage: 'radial-gradient(rgba(120,110,110,0.07) 1px, transparent 1px)',
        backgroundSize: '18px 18px',
      }}
    >
      {messages.length === 0 && emptyHint && (
        <div className="mx-auto mt-8 max-w-[85%] rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 shadow-sm dark:bg-amber-500/10 dark:text-amber-200">
          {emptyHint}
        </div>
      )}
      {messages.map((m, i) => {
        const mine = m.sender === meSide
        const dl = dateLabel(m.created_at)
        const showDate = dl !== lastDate
        lastDate = dl
        const prev = messages[i - 1]
        const grouped = !!prev && prev.sender === m.sender && !showDate
        const read = mine ? (meSide === 'admin' ? m.read_user : m.read_admin) : false
        return (
          <div key={m.id}>
            {showDate && (
              <div className="my-3 flex justify-center">
                <span className="rounded-lg bg-black/10 px-3 py-1 text-[11px] font-medium text-gray-600 shadow-sm dark:bg-white/10 dark:text-gray-300">
                  {dl}
                </span>
              </div>
            )}
            <div className={clsx('flex', mine ? 'justify-end' : 'justify-start', grouped ? 'mt-0.5' : 'mt-2')}>
              <div
                className={clsx(
                  'relative max-w-[80%] rounded-xl px-2.5 py-1.5 text-sm shadow-sm',
                  mine
                    ? 'bg-maroon-700 text-white'
                    : 'bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100',
                  !grouped && (mine ? 'rounded-tr-sm' : 'rounded-tl-sm')
                )}
              >
                <span className="whitespace-pre-wrap break-words">{m.body}</span>
                {/* Jam + centang, mengambang di kanan-bawah ala WA */}
                <span
                  className={clsx(
                    'float-right ml-2 mt-1 flex translate-y-0.5 select-none items-center gap-0.5 text-[10px]',
                    mine ? 'text-white/70' : 'text-gray-400'
                  )}
                >
                  {timeOf(m.created_at)}
                  {mine && (read
                    ? <CheckCheck size={13} className="text-sky-300" />
                    : <Check size={13} className="text-white/60" />)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
