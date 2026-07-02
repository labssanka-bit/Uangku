import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

/** Set password baru — muncul saat user klik link reset dari email (recovery). */
export function ResetPassword() {
  const { clearRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (password.length < 6) { setMsg('Password minimal 6 karakter.'); return }
    if (password !== confirm) { setMsg('Konfirmasi password tidak cocok.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setOk(true)
      setMsg('Password berhasil diubah! Kamu sudah masuk.')
      setTimeout(() => { clearRecovery(); window.location.href = '/' }, 1200)
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Gagal mengubah password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-gray-100 px-6 dark:bg-gray-950">
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="Finplan Sanka" className="mx-auto w-48" />
        <h1 className="mt-4 text-xl font-extrabold text-maroon-800 dark:text-dusty-200">Buat Password Baru</h1>
        <p className="text-sm text-gray-400">Masukkan password baru untuk akunmu.</p>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="password"
          placeholder="Password baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-card outline-none dark:bg-gray-900"
        />
        <input
          type="password"
          placeholder="Ulangi password baru"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-card outline-none dark:bg-gray-900"
        />
        {msg && <p className={`text-center text-xs ${ok ? 'text-sage-600' : 'text-wine-500'}`}>{msg}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-maroon-700 py-3 text-base font-bold text-white shadow-soft disabled:opacity-50"
        >
          {loading ? 'Menyimpan…' : 'Simpan Password Baru'}
        </button>
      </form>
    </div>
  )
}
