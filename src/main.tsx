import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { AuthProvider } from '@/hooks/useAuth'
import { initDemoFromUrl } from '@/lib/demo'
import { applyTheme } from '@/lib/themes'
import { useUIStore } from '@/store/uiStore'
import App from './App'
import './index.css'

// Aktifkan mode demo bila URL ?demo=1 (sebelum render)
initDemoFromUrl()
// Terapkan tema tersimpan sebelum render (hindari flash)
applyTheme(useUIStore.getState().theme)
if (useUIStore.getState().dark) document.documentElement.classList.add('dark')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)

// Daftarkan service worker → PWA installable (buka fullscreen tanpa bar browser)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
