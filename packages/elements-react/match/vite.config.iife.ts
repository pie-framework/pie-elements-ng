import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false, // Don't wipe existing ESM builds
    lib: {
      entry: resolve(__dirname, 'src/index.iife.ts'),
      name: 'MatchElement',
      fileName: () => 'index.iife.js',
      formats: ['iife'] as const,
    },
    rollupOptions: {
      external: (id: string) => {
        // Bundle everything including React and math-rendering
        // This creates a fully self-contained IIFE bundle
        return false;
      },
      output: {
        // IIFE global name
        name: 'MatchElement',
        extend: true,
      },
    },
  },
});
