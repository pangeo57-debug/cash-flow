import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const version = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return new Date().toISOString().slice(0, 10)
  }
})()

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(version) },
  base: './',
  plugins: [react()],
})
