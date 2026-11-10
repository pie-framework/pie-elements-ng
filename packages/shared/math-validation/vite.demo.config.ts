import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// The demo page: `bun run demo` serves it, `bun run build:demo` writes it to demo/dist.
export default defineConfig({
  root: resolve(__dirname, 'demo'),
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
