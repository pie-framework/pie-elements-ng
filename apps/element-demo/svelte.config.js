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
    dynamicCompileOptions: ({ filename, compileOptions }) => {
      // Workspace element entry components are authored as custom elements.
      // When element-demo resolves package "development" exports to source,
      // force CE compilation for those files only.
      if (
        /\/packages\/elements-svelte\/[^/]+\/src\/(delivery|author|print)\/.*\.svelte$/.test(
          filename
        )
      ) {
        return { ...compileOptions, customElement: true };
      }
      return compileOptions;
    },
  },
};

export default config;
