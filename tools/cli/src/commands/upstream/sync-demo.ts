/**
 * Demo generation utilities for sync operations
 */

/**
 * Generate demo module JavaScript code
 *
 * Note: Always uses dynamic imports with try/catch for configure and controller
 * since they may be unavailable due to ESM incompatibility
 */
export function generateDemoModule(): string {
  return `import config from './config.mjs';
import sessions from './session.mjs';
import Element from '../../dist/index.js';

// NOTE: Configure and controller components may not be available if they have non-ESM dependencies
// Use dynamic import with URL to bypass Vite's static analysis in dev mode
let Configure;
let controller;

// Dynamic import for Configure - may not exist if blocked by ESM incompatibility
const configureUrl = new URL('../../dist/configure/index.js', import.meta.url).href;
try {
  ({ default: Configure } = await import(/* @vite-ignore */ configureUrl));
} catch (e) {
  console.warn('Configure component not available:', e.message);
}

// Dynamic import for Controller
const controllerUrl = new URL('../../dist/controller/index.js', import.meta.url).href;
try {
  controller = await import(/* @vite-ignore */ controllerUrl);
} catch (e) {
  console.warn('Controller not available:', e.message);
}

customElements.whenDefined('demo-el').then(() => {
  const demo = document.querySelector('demo-el');
  if (!demo) return;
  const model = Array.isArray(config?.models) ? config.models[0] : undefined;
  demo.def = {
    tagName: model?.element,  // Get tag name from model (e.g., 'hotspot-element')
    Element,
    Configure,
    controller,
  };
  demo.model = model;
  demo.session = Array.isArray(sessions) ? sessions[0] : sessions;
});
`;
}

/**
 * Generate demo HTML page
 */
export function generateDemoHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PIE Demo</title>
    <script type="importmap">
      {
        "imports": {
          "react": "https://esm.sh/react@18.2.0",
          "react-dom": "https://esm.sh/react-dom@18.2.0",
          "react-dom/": "https://esm.sh/react-dom@18.2.0/",
          "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
          "react-konva": "https://esm.sh/react-konva@18.1.0",
          "konva": "https://esm.sh/konva@8.3.0",
          "prop-types": "https://esm.sh/prop-types@15.8.1",
          "debug": "https://esm.sh/debug@4.3.4",
          "lodash": "https://esm.sh/lodash@4.17.21",
          "lodash/": "https://esm.sh/lodash@4.17.21/",
          "lodash-es": "https://esm.sh/lodash-es@4.17.22",
          "@pie-framework/pie-player-events": "../../../../shared/player-events/dist/index.js",
          "@pie-framework/mathml-to-latex": "../../../../shared/mathml-to-latex/dist/index.js",
          "@pie-elements-ng/shared-math-rendering": "../../../../shared/math-rendering/dist/index.js",
          "@pie-lib/controller-utils": "../../../../lib-react/controller-utils/dist/index.js",
          "katex": "https://esm.sh/katex@0.16.9",
          "katex/": "https://esm.sh/katex@0.16.9/",
          "@mui/": "https://esm.sh/@mui/",
          "@emotion/": "https://esm.sh/@emotion/"
        }
      }
    </script>
    <link rel="stylesheet" href="https://esm.sh/katex@0.16.9/dist/katex.min.css" />
  </head>
  <body>
    <demo-el></demo-el>
    <script type="module" src="https://unpkg.com/@pslb/demo-el@^1.0.0/dist/demo-el/demo-el.esm.js"></script>
    <script type="module" src="./demo.mjs"></script>
  </body>
</html>
`;
}
