import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { vitePwaOptions } from './settings/pwa/vite-plugin.js'

// برای GitHub Pages: npm run build:gh  (base=/vite-vue-pwa-capacitor/)
// اگر اسم ریپو فرق دارد، در package.json همان را عوض کن
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@settings': fileURLToPath(new URL('./settings', import.meta.url)),
    },
  },
  plugins: [vue(), VitePWA(vitePwaOptions)],
})
