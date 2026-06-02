import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/** Halaman login / daftar sederhana via email + password (Supabase Auth). */
export function Login() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        })
        if (error) throw error
        setMsg('Berhasil daftar! Cek email untuk verifikasi, lalu masuk.')
        setMode('login')
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Terjadi kesalahan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-gray-100 px-6 dark:bg-gray-950">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-soft">
          <Wallet size={32} />
        </div>
        <h1 className="text-2xl font-extrabold">UangKu</h1>
        <p className="text-sm text-gray-400">Catatan keuangan pribadi yang simpel</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Nama lengkap"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-card outline-none dark:bg-gray-900"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-card outline-none dark:bg-gray-900"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-card outline-none dark:bg-gray-900"
        />

        {msg && <p className="text-center text-xs text-rose-500">{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-emerald-500 py-3 text-base font-bold text-white shadow-soft disabled:opacity-50"
        >
          {loading ? 'Memproses…' : mode === 'login' ? 'Masuk' : 'Daftar'}
        </button>
      </form>

      <button
        onClick={() => {
          setMode((m) => (m === 'login' ? 'signup' : 'login'))
          setMsg(null)
        }}
        className="mt-4 text-center text-sm text-gray-500"
      >
        {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
        <span className="font-semibold text-emerald-600">
          {mode === 'login' ? 'Daftar' : 'Masuk'}
        </span>
      </button>
    </div>
  )
}
