import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '38dd1179-b303-497a-b002-b5611c6b390c.preview.emergentagent.com',
      '.preview.emergentagent.com'
    ],
    hmr: {
      clientPort: 3000
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
