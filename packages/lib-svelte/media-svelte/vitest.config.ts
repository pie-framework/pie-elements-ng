import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    conditions: ['browser'],
  },
  test: {
    // DOMPurify under happy-dom drops allowed block elements such as <p>, so the sanitizer tests
    // need a real HTML parser.
    environment: 'jsdom',
  },
});
