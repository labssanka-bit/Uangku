import { useEffect, useState } from 'react'
import { ChevronLeft, Send, Headset, Inbox } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { ChatThread } from '@/components/ChatThread'
import { useProfile } from '@/hooks/useProfile'
import { useAdminConversations, useChatMessages, useChatMutations } from '@/hooks/useSupportChat'
import { formatTanggal } from '@/lib/format'

/** Daftar percakapan support + balas. Hanya untuk is_admin. */
export function AdminChat({ embedded = false }: { embedded?: boolean }) {
  const { data: profile } = useProfile()
  const [sel, setSel] = useState<{ id: string; name: string } | null>(null)
  const { data: convos = [] } = useAdminConversations(!!profile?.is_admin)
  const { data: msgs = [] } = useChatMessages(sel?.id ?? null, !!sel)
  const { send, markRead } = useChatMutations()
  const [text, setText] = useState('')

  useEffect(() => {
    if (sel) markRead.mutate({ userId: sel.id, as: 'admin' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel?.id, msgs.length])

  if (profile && !profile.is_admin && !embedded) {
    return (
      <div className="px-4 pt-5">
        <PageHeader title="Admin" />
        <p className="py-16 text-center text-sm text-gray-400">Halaman khusus admin.</p>
      </div>
    )
  }

  function submit() {
    const b = text.trim()
    if (!b || !sel) return
    send.mutate({ userId: sel.id, sender: 'admin', body: b })
    setText('')
  }

  // Tampilan percakapan terpilih
  if (sel) {
    return (
      <div className="flex h-[calc(100vh-1px)] flex-col px-0 lg:h-[calc(100vh-1px)]">
        <div className="flex items-center gap-3 bg-maroon-700 px-4 py-4 text-white">
          <button onClick={() => setSel(null)} aria-label="Kembali"><ChevronLeft size={24} /></button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20"><Headset size={18} /></span>
          <p className="font-bold">{sel.name}</p>
        </div>
        <ChatThread messages={msgs} meSide="admin" emptyHint={`Belum ada pesan dengan ${sel.name}.`} />
        <div className="flex items-center gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Balas sebagai admin…"
            className="flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm outline-none dark:bg-gray-800"
          />
          <button onClick={submit} disabled={!text.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-700 text-white disabled:opacity-40" aria-label="Kirim">
            <Send size={18} />
          </button>
        </div>
      </div>
    )
  }

  // Daftar percakapan
  return (
    <div className={embedded ? '' : 'px-4 pt-5'}>
      {!embedded && <PageHeader title="Chat Support (Admin)" />}
      {convos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-400">
          <Inbox size={32} /><p className="text-sm">Belum ada percakapan masuk.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {convos.map((c) => (
            <Card key={c.user_id} onClick={() => setSel({ id: c.user_id, name: c.name })} className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-maroon-100 text-maroon-700 dark:bg-maroon-500/20">
                {c.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="truncate font-semibold">{c.name}</p>
                  <span className="shrink-0 text-[11px] text-gray-400">{formatTanggal(c.last_at)}</span>
                </div>
                <p className="truncate text-xs text-gray-400">{c.last}</p>
              </div>
              {c.unread > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-wine-500 px-1.5 text-xs font-bold text-white">{c.unread}</span>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
