import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { enterDemo } from '@/lib/demo'
import { redeemLicense } from '@/lib/license'

/** Halaman login / daftar / lupa password via Supabase Auth. */
export function Login() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    setOk(false)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else if (mode === 'forgot') {
        // Kirim email berisi link reset password (buka app dgn event PASSWORD_RECOVERY)
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (error) throw error
        setOk(true)
        setMsg('Link reset password sudah dikirim ke emailmu. Cek inbox / folder spam, lalu klik link-nya untuk buat password baru.')
      } else {
        // Daftar wajib pakai kode akses (dari pembelian) → buat akun lalu login otomatis
        await redeemLicense({ code: code.trim(), email, password, full_name: fullName })
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
          setOk(true)
          setMsg('Akun dibuat! Silakan Masuk dengan email & password kamu.')
          setMode('login')
        }
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
        <img src="/logo.png" alt="Finplan Sanka" className="mx-auto w-56" />
      </div>

      {mode === 'signup' && (
        <p className="mb-3 rounded-2xl bg-maroon-50 px-4 py-3 text-center text-xs text-maroon-700 dark:bg-maroon-500/10 dark:text-dusty-200">
          🔑 Daftar butuh <b>Kode Akses</b> dari pembelian. Belum punya?{' '}
          <a href="https://digital-store-27.myscalev.com/landing-page-baru-8" target="_blank" rel="noreferrer" className="font-bold underline">Beli di sini</a>.
        </p>
      )}

      {mode === 'forgot' && (
        <p className="mb-3 rounded-2xl bg-maroon-50 px-4 py-3 text-center text-xs text-maroon-700 dark:bg-maroon-500/10 dark:text-dusty-200">
          🔒 Masukkan email akunmu. Kami kirim <b>link</b> untuk membuat password baru
          (demi keamanan, password lama tidak bisa ditampilkan).
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Kode Akses (mis. FS-AB12-CD34)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="w-full rounded-2xl border border-maroon-200 bg-white px-4 py-3 text-center text-sm font-semibold uppercase tracking-wider shadow-card outline-none dark:border-maroon-700/40 dark:bg-gray-900"
          />
        )}
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
        {mode !== 'forgot' && (
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-2xl bg-white px-4 py-3 text-sm shadow-card outline-none dark:bg-gray-900"
          />
        )}

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => { setMode('forgot'); setMsg(null); setOk(false) }}
            className="block w-full text-right text-xs font-semibold text-maroon-700 dark:text-dusty-200"
          >
            Lupa password?
          </button>
        )}

        {msg && <p className={`text-center text-xs ${ok ? 'text-sage-600' : 'text-wine-500'}`}>{msg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-maroon-700 py-3 text-base font-bold text-white shadow-soft disabled:opacity-50"
        >
          {loading ? 'Memproses…' : mode === 'login' ? 'Masuk' : mode === 'forgot' ? 'Kirim Link Reset' : 'Daftar'}
        </button>
      </form>

      {mode === 'forgot' ? (
        <button
          onClick={() => { setMode('login'); setMsg(null); setOk(false) }}
          className="mt-4 text-center text-sm text-gray-500"
        >
          ← Kembali ke <span className="font-semibold text-maroon-700">Masuk</span>
        </button>
      ) : (
        <>
          {/* Coba tanpa daftar */}
          <div className="my-4 flex items-center gap-3 text-xs text-gray-400">
            <span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />atau<span className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>
          <button
            onClick={() => { enterDemo(); window.location.href = '/' }}
            className="w-full rounded-2xl border border-maroon-200 bg-white py-3 text-base font-bold text-maroon-700 shadow-card dark:border-maroon-700/40 dark:bg-gray-900 dark:text-dusty-200"
          >
            👀 Coba Demo dulu (tanpa daftar)
          </button>

          <button
            onClick={() => {
              setMode((m) => (m === 'login' ? 'signup' : 'login'))
              setMsg(null)
            }}
            className="mt-4 text-center text-sm text-gray-500"
          >
            {mode === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <span className="font-semibold text-maroon-700">
              {mode === 'login' ? 'Daftar' : 'Masuk'}
            </span>
          </button>
        </>
      )}
    </div>
  )
}
