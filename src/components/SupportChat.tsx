import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, Headset } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { useChatMessages, useUserUnread, useChatMutations } from '@/hooks/useSupportChat'
import { isDemo } from '@/lib/demo'
import { clsx } from '@/lib/clsx'

/** Tombol bantuan melayang + sheet chat ke admin (sisi user). */
export function SupportChat() {
  const { user } = useAuth()
  const { data: profile } = useProfile()
  const me = user?.id ?? null
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const { data: msgs = [] } = useChatMessages(me, open)
  const { data: unread = 0 } = useUserUnread(me, !isDemo())
  const { send, markRead } = useChatMutations()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && me) {
      markRead.mutate({ userId: me, as: 'user' })
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, msgs.length])

  if (isDemo() || !me || profile?.is_admin) return null

  function submit() {
    const b = text.trim()
    if (!b || !me) return
    send.mutate({ userId: me, sender: 'user', body: b })
    setText('')
  }

  return (
    <>
      {/* Tombol melayang */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Bantuan"
        className="fixed bottom-28 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-maroon-700 text-white shadow-soft active:scale-95 lg:bottom-8"
      >
        <MessageCircle size={26} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-wine-500 px-1.5 text-xs font-bold text-white ring-2 ring-white dark:ring-gray-950">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative z-10 flex h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-soft dark:bg-[#221519] sm:h-[600px] sm:rounded-3xl">
            {/* Header */}
            <div className="flex items-center gap-3 bg-maroon-700 px-5 py-4 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20"><Headset size={20} /></span>
              <div className="flex-1">
                <p className="font-bold leading-tight">Bantuan Finplan Sanka</p>
                <p className="text-xs opacity-80">Biasanya balas &lt; 24 jam</p>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Tutup"><X size={22} /></button>
            </div>

            {/* Pesan */}
            <div className="flex-1 space-y-3 overflow-y-auto bg-dusty-50 p-4 no-scrollbar dark:bg-[#1C1418]">
              {msgs.length === 0 && (
                <div className="mt-8 text-center text-sm text-gray-400">
                  👋 Halo! Ada yang bisa kami bantu soal Finplan Sanka? Tulis pesanmu di bawah.
                </div>
              )}
              {msgs.map((m) => (
                <div key={m.id} className={clsx('flex', m.sender === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={clsx(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    m.sender === 'user'
                      ? 'rounded-br-md bg-maroon-700 text-white'
                      : 'rounded-bl-md bg-white text-gray-800 shadow-card dark:bg-gray-800 dark:text-gray-100'
                  )}>
                    {m.body}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="Tulis pesan…"
                className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
              />
              <button
                onClick={submit}
                disabled={!text.trim()}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-700 text-white disabled:opacity-40"
                aria-label="Kirim"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
