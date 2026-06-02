import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        // Hormati PORT dari environment (mis. saat dijalankan di harness preview)
        port: process.env.PORT ? Number(process.env.PORT) : 5173,
        strictPort: false,
    },
});
