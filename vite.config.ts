
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // Se elimina terser y se usa esbuild para evitar errores de dependencias faltantes en Vercel.
    minify: 'esbuild',
  },
  server: {
    port: 3000,
  }
});
