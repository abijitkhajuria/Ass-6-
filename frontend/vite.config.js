import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Charts and animation are the two heavy dependencies; splitting them
        // keeps the app chunk small and lets them cache independently.
        manualChunks: {
          charts: ['recharts'],
          motion: ['framer-motion'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Calls to /api are proxied to Spring Boot, so the browser only ever talks
    // to one origin in development. CORS is configured on the backend as well,
    // for the case where the frontend is served from somewhere else.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
