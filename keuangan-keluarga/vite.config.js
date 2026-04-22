import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`,
        chunkFileNames: `assets/[name].[hash].js`,
        assetFileNames: `assets/[name].[hash].[ext]`
      }
    }
  },
  server: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  },
  preview: {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  }
})
