import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import wasm from 'vite-plugin-wasm'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), wasm()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@wasm': resolve(__dirname, '../wasm-api/pkg'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API requests to backend during development
      '/jsonapi': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
