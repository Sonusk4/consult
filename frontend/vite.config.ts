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
        '/auth': 'http://127.0.0.1:5001',
        '/consultant': 'http://127.0.0.1:5001',
        '/consultants': 'http://127.0.0.1:5001',
        '/user': 'http://127.0.0.1:5001',
        '/bookings': 'http://127.0.0.1:5001',
        '/wallet': 'http://127.0.0.1:5001',
        '/payment': 'http://127.0.0.1:5001',
        '/credit-packages': 'http://127.0.0.1:5001',
        '/transactions': 'http://127.0.0.1:5001',
        '/ConsultantSupportPage': 'http://127.0.0.1:5001',
        '/support': 'http://127.0.0.1:5001',
        '/enterprise': 'http://127.0.0.1:5001',

      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});