import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
  },
  vitePlugin: {
    exclude: [/\/dist\//],
    dynamicCompileOptions: ({ filename, compileOptions }) => {
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
