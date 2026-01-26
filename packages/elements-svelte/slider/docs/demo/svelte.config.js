/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Enable runes mode for Svelte 5
    runes: true,
    // Enable custom element compilation for web components
    customElement: true,
  },
};

export default config;
