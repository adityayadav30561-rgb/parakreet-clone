import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      lib: { entry: resolve(__dirname, 'electron/main/index.ts') },
      rollupOptions: { external: ['better-sqlite3'] },
    },
  },
  preload: {
    build: {
      outDir: 'out/preload',
      lib: { entry: resolve(__dirname, 'preload/index.ts') },
    },
  },
  renderer: {
    root: resolve(__dirname, 'renderer'),
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'out/renderer',
      rollupOptions: { input: resolve(__dirname, 'renderer/index.html') },
    },
  },
});
