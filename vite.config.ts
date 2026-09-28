import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/COER_LVNS/',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, strictPort: false },
  preview: { host: '0.0.0.0', port: 4173, strictPort: false },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
