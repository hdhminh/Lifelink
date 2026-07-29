import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/vue') ||
            id.includes('node_modules/@vue') ||
            id.includes('node_modules/vue-router')
          ) {
            return 'vue-vendor'
          }
          if (id.includes('node_modules/firebase/auth')) {
            return 'firebase-auth'
          }
          if (id.includes('node_modules/firebase/firestore')) {
            return 'firebase-firestore'
          }
          if (id.includes('node_modules/firebase/database')) {
            return 'firebase-rtdb'
          }
          if (id.includes('node_modules/firebase/messaging')) {
            return 'firebase-messaging'
          }
          if (id.includes('node_modules/firebase')) {
            return 'firebase-core'
          }
          if (id.includes('node_modules/leaflet')) {
            return 'leaflet-vendor'
          }
          if (id.includes('node_modules/bootstrap')) {
            return 'bootstrap-vendor'
          }
          return undefined
        }
      }
    },
    minify: 'esbuild'
  },
  base: './'
})
