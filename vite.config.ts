import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/auth': 'http://localhost:5001',
          '/consultant': 'http://localhost:5001',
          '/consultants': 'http://localhost:5001',
          '/user': 'http://localhost:5001',
          '/bookings': 'http://localhost:5001',
          '/wallet': 'http://localhost:5001',
          '/payment': 'http://localhost:5001',
          '/credit-packages': 'http://localhost:5001',
          '/transactions': 'http://localhost:5001',
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
