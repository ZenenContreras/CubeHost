import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // Redirige todas las llamadas a /api/* al backend Express en el puerto 4000.
      // Esto solo aplica en desarrollo local (pnpm dev).
      // En producción, Caddy se encarga del ruteo.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
})
