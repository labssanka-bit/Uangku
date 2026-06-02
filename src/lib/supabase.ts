import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Peringatan jelas saat .env belum diisi
  console.warn(
    '[UangKu] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diset. ' +
      'Salin .env.example menjadi .env lalu isi kredensial Supabase kamu.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
