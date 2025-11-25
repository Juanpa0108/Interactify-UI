import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Allow popups (Firebase auth signInWithPopup) to communicate with the opener
    // without being blocked by the browser Cross-Origin-Opener-Policy during dev.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    }
  }
})
