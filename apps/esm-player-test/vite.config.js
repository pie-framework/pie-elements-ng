import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    open: true,
    fs: {
      // Allow serving files from monorepo root and pie-players workspace
      allow: ['../..', '../../../pie-players'],
    },
  },
  resolve: {
    alias: {
      // Alias for local element builds
      '@local-elements': resolve(__dirname, '../../packages/elements-wc'),
    },
  },
});
