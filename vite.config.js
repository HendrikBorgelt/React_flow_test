import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // In dev, serve from root so localhost:5173/ works without a sub-path.
  // In production, the React app lives at /React_flow_test/widget/.
  base: command === 'serve' ? '/' : '/React_flow_test/widget/',
  publicDir: false, // We copy docs files ourselves via scripts/copy-docs.mjs
  build: {
    outDir: 'dist/widget',
    emptyOutDir: true,
  },
}))
