import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'

/** Header sub-halaman dengan tombol kembali + judul + aksi opsional. */
export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  const nav = useNavigate()
  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        onClick={() => nav(-1)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-600 shadow-card dark:bg-gray-900 dark:text-gray-300"
        aria-label="Kembali"
      >
        <ChevronLeft size={20} />
      </button>
      <h1 className="flex-1 text-xl font-extrabold">{title}</h1>
      {action}
    </div>
  )
}
