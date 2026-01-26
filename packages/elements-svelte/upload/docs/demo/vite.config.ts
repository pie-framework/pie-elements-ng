import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { createVitePlugin as createLocalEsmCdnPlugin } from '../../../../../apps/local-esm-cdn/src/adapters/vite.js';
import path from 'node:path';

export default defineConfig({
  plugins: [
    svelte(),
    createLocalEsmCdnPlugin({
      repoRoot: path.resolve(__dirname, '../../../../..'),
      esmShBaseUrl: 'https://esm.sh',
      buildScope: 'esm',
    }),
  ],
  server: {
    // Port can be overridden via --port flag
    // Default is 5300 to match React element demos
    port: 5300,
  },
  preview: {
    port: 5300,
  },
});
