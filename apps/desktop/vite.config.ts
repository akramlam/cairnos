import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Tauri expects a fixed port and a clean terminal.
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    // Routes are code-split via React.lazy (see App.tsx). We intentionally do
    // NOT hand-split the React vendor into its own chunk - that reintroduces a
    // chunk-load-order race where Radix evaluates React.forwardRef before React
    // is initialized. A single vendor chunk is correct and well under the limit.
    chunkSizeWarningLimit: 900,
  },
});
