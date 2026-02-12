import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/places-search': {
        target: 'https://places.googleapis.com',
        changeOrigin: true,
        rewrite: () => '/v1/places:searchText',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Move a chave customizada do header X-Api-Key para X-Goog-Api-Key
            const apiKey = proxyReq.getHeader('x-api-key') as string;
            if (apiKey) {
              proxyReq.setHeader('X-Goog-Api-Key', apiKey);
              proxyReq.removeHeader('x-api-key');
            }
          });
        }
      },
      '/api/places-details': {
        target: 'https://places.googleapis.com',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const placeId = url.searchParams.get('placeId');
          return `/v1/places/${placeId}`;
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            const apiKey = proxyReq.getHeader('x-api-key') as string;
            if (apiKey) {
              proxyReq.setHeader('X-Goog-Api-Key', apiKey);
              proxyReq.removeHeader('x-api-key');
            }
          });
        }
      }
    }
  }
})
