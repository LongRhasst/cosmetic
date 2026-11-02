import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Gọi /api/... trong FE sẽ được chuyển tới backend FastAPI (bỏ tiền tố /api).
    // Đổi địa chỉ backend: API_URL=http://127.0.0.1:8001 npm run dev
    proxy: {
      '/api': {
        target: process.env.API_URL ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
