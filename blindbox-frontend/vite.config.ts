// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // 将 /api/upload 开头的请求转发到后端
      '/api/upload': {
        target: 'http://localhost:7001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upload/, '/upload'),
      },
    },
  },
});