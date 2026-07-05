import { useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

/**
 * Kotak tulis chat gaya WA: textarea multi-baris auto-tinggi.
 * Enter = baris baru. Kirim lewat tombol (atau Ctrl/Cmd+Enter).
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-tinggi mengikuti isi (maks ~6 baris, lalu scroll)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 140) + 'px'
  }, [value])

  function send() {
    if (!value.trim()) return
    onSend()
    requestAnimationFrame(() => {
      if (ref.current) ref.current.style.height = 'auto'
    })
  }

  return (
    <div className="flex items-end gap-2 border-t border-gray-100 p-3 dark:border-gray-800">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            send()
          }
        }}
        rows={1}
        placeholder={placeholder}
        className="max-h-[140px] min-h-[2.75rem] flex-1 resize-none rounded-2xl bg-gray-100 px-4 py-3 text-sm leading-relaxed outline-none no-scrollbar dark:bg-gray-800"
      />
      <button
        onClick={send}
        disabled={!value.trim()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-maroon-700 text-white disabled:opacity-40"
        aria-label="Kirim"
      >
        <Send size={18} />
      </button>
    </div>
  )
}
