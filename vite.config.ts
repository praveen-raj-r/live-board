import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'happy-dom',
    globals: true, // lets Testing Library auto-register its cleanup
    setupFiles: ['./src/test/setup.ts'],
    // src/lib/supabase.ts throws without these. Tests use a fake client, so dummy values keep them independent of any real .env.
    env: { VITE_SUPABASE_URL: 'http://localhost:54321', VITE_SUPABASE_ANON_KEY: 'test-anon-key' },
  },
})
