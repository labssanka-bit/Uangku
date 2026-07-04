import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { isDemo } from '@/lib/demo'
import { useAuth } from './useAuth'

/**
 * Kirim "denyut" last_seen ke server berkala supaya admin tahu siapa sedang/terakhir aktif.
 * Ping saat mount, tiap 60 detik, dan saat tab kembali terlihat.
 */
export function useHeartbeat() {
  const { user } = useAuth()
  useEffect(() => {
    if (!user || isDemo()) return
    const ping = () => { supabase.rpc('touch_last_seen').then(() => {}, () => {}) }
    ping()
    const id = setInterval(ping, 60_000)
    const onVis = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [user])
}
