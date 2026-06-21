import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// Served as a GitHub Pages *project* site at https://akramlam.github.io/cairnos/,
// so all assets must resolve under /cairn/. Change `base` to '/' for a custom domain.
export default defineConfig({
  base: '/cairnos/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
