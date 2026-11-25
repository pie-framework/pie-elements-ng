import { defineEnvVars } from '@sveltejs/kit/env';

// Build-time switches for the demo. The GitHub Pages build sets the first two; local runs set none.
export const variables = defineEnvVars({
  PUBLIC_ELEMENT_DEMO_STATIC: {
    public: true,
    static: true,
    description: '"true" for the static GitHub Pages build, which has no bundle API.',
    schema: (value) => value === 'true',
  },
  PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_MODE: {
    public: true,
    static: true,
    description:
      '"hosted" loads IIFE bundles from the hosted bundler; anything else builds them locally.',
    schema: (value): 'local' | 'hosted' => (value === 'hosted' ? 'hosted' : 'local'),
  },
  PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_ENDPOINT: {
    public: true,
    static: true,
    description: 'Local bundle API endpoint. Defaults to /api/bundle.',
    schema: (value) => value || undefined,
  },
  PUBLIC_ELEMENT_DEMO_IIFE_BUNDLE_HOST: {
    public: true,
    static: true,
    description: 'Hosted bundle base URL. Defaults to https://proxy.pie-api.com/bundles/.',
    schema: (value) => value || undefined,
  },
});
