import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import url from '@rollup/plugin-url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), url({
    include: /\.(png|jpe?g|gif|webp|svg|ico|xml|json|onnx)$/i,
  })],
  server: {
    cors: true
  }
})
