import { useState } from 'react'
import { Bell, Megaphone, Clock } from 'lucide-react'
import { Sheet } from '@/components/ui/Sheet'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useProfile } from '@/hooks/useProfile'
import { useUIStore } from '@/store/uiStore'
import { formatTanggal } from '@/lib/format'
import { clsx } from '@/lib/clsx'

const LIFETIME_URL = 'https://digital-store-27.myscalev.com/lifetimefinplansanka'
const MONTHLY_URL = 'https://digital-store-27.myscalev.com/monthlyfinplansanka'

function daysLeft(iso?: string | null): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

/** Lonceng notifikasi: pengingat masa aktif + pengumuman/update dari admin. */
export function NotifBell() {
  const [open, setOpen] = useState(false)
  const { data: anns = [] } = useAnnouncements()
  const { data: profile } = useProfile()
  const seenAt = useUIStore((s) => s.notifSeenAt)
  const markSeen = useUIStore((s) => s.markNotifSeen)

  const dleft = daysLeft(profile?.access_until)
  const expirySoon = dleft !== null && dleft <= 10 // paket bulanan hampir habis
  const unseenAnn = anns.some((a) => !seenAt || new Date(a.created_at) > new Date(seenAt))
  const hasDot = unseenAnn || expirySoon

  function openPanel() {
    setOpen(true)
    markSeen()
  }

  return (
    <>
      <button
        onClick={openPanel}
        aria-label="Notifikasi"
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white text-maroon-700 shadow-card active:scale-95 dark:bg-gray-900 dark:text-dusty-200"
      >
        <Bell size={18} />
        {hasDot && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-wine-500 ring-2 ring-white dark:ring-gray-900" />}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifikasi">
        {/* Pengingat masa aktif (paket bulanan) */}
        {dleft !== null && (
          <div className={clsx('mb-3 rounded-2xl p-4', dleft <= 0 ? 'bg-wine-50 dark:bg-wine-500/10' : expirySoon ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-dusty-50 dark:bg-dusty-500/10')}>
            <div className="mb-1 flex items-center gap-2">
              <Clock size={16} className={dleft <= 0 ? 'text-wine-500' : 'text-amber-600'} />
              <h3 className="text-sm font-bold">
                {dleft <= 0 ? 'Masa aktif berakhir' : dleft <= 10 ? `Masa aktif tinggal ${dleft} hari` : 'Masa aktif akun'}
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Paket kamu berlaku sampai <b>{formatTanggal(profile!.access_until!)}</b>.
              {expirySoon ? ' Perpanjang agar akses tak terputus — datamu tetap aman.' : ''}
            </p>
            {expirySoon && (
              <div className="mt-3 grid grid-cols-1 gap-2">
                <a href={LIFETIME_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-maroon-700 py-2.5 text-center text-sm font-bold text-white">
                  ♾️ Upgrade Selamanya — Rp149.000
                </a>
                <a href={MONTHLY_URL} target="_blank" rel="noreferrer" className="rounded-xl border-2 border-maroon-700 py-2.5 text-center text-sm font-bold text-maroon-700 dark:text-dusty-200">
                  Perpanjang Bulanan — Rp99.000
                </a>
              </div>
            )}
          </div>
        )}

        {/* Pengumuman / update */}
        <h3 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-bold text-gray-600 dark:text-gray-300">
          <Megaphone size={15} /> Pengumuman & Update
        </h3>
        {anns.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Belum ada pengumuman.</p>
        ) : (
          <div className="space-y-2">
            {anns.map((a) => (
              <div key={a.id} className="rounded-2xl bg-white p-3.5 shadow-card dark:bg-gray-900">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold">{a.title}</p>
                  <span className="shrink-0 text-[11px] text-gray-400">{formatTanggal(a.created_at)}</span>
                </div>
                {a.body && <p className="mt-1 whitespace-pre-line text-sm text-gray-500">{a.body}</p>}
              </div>
            ))}
          </div>
        )}
      </Sheet>
    </>
  )
}
