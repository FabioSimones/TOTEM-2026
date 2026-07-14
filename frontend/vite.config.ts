import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    // TASK-102: sem isso, o default do Vitest (**/*.{test,spec}.*) também casa frontend/e2e/*.spec.ts
    // (Playwright) — os dois usam `test`/`describe` com semântica incompatível. Convenção do projeto:
    // Vitest usa *.test.ts(x) em src/, Playwright usa *.spec.ts em e2e/ (ver playwright.config.ts).
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
