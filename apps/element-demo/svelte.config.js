import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
  // Configure vite-plugin-svelte to not process pre-compiled element packages
  vitePlugin: {
    // Exclude pre-compiled Svelte files from processing
    exclude: [
      /\/dist\//, // Don't process anything in dist directories
    ],
  },
};

export default config;
