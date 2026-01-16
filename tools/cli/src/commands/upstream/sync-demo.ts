/**
 * Demo generation utilities for sync operations
 *
 * Generates two demos for each element:
 * 1. Delivery demo (index.html) - Student/teacher-facing UI with gather/view/evaluate modes
 * 2. Author demo (author.html) - Authoring UI with configure mode
 */

/**
 * Generate delivery demo HTML (index.html)
 * Uses the main element component for delivery (student/teacher-facing) modes
 */
export function generateDeliveryDemoHtml(elementName: string): string {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PIE Demo - ${elementName} (Delivery)</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <pie-demo-player></pie-demo-player>

  <script type="module">
    // Import the demo player (relative path from docs/demo/)
    import '../../../../demo-player/dist/index.js';

    // Import element components for DELIVERY UI (student/teacher-facing)
    import Element from '../../dist/index.js';

    // Controller module for processing models
    let controller;
    const controllerUrl = new URL('../../dist/controller/index.js', import.meta.url).href;
    try {
      controller = await import(/* @vite-ignore */ controllerUrl);
    } catch (e) {
      console.warn('Controller not available:', e.message);
    }

    // Import config and session data
    import config from './config.mjs';
    import sessions from './session.mjs';

    // Get the demo player element
    const player = document.querySelector('pie-demo-player');

    // Set the element definition (DELIVERY only)
    player.element = {
      Element,
      controller,
      // Note: No Author component - use author.html for authoring UI
    };

    // Set initial model (use first model from config)
    const model = Array.isArray(config?.models) ? config.models[0] : config;
    player.model = model;

    // Set initial session
    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    player.session = session;

    // Start in GATHER mode for student interaction
    player.mode = 'gather';

    // Listen for session changes
    player.addEventListener('session-changed', (e) => {
      console.log('Session changed:', e.detail);
    });
  </script>
</body>
</html>
`;
}

/**
 * Generate author demo HTML (author.html)
 * Uses the configure component for authoring mode
 */
export function generateAuthorDemoHtml(elementName: string): string {
  return `<!doctype html>
<html lang="en" data-theme="light">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>PIE Demo - ${elementName} (Author)</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <pie-demo-player></pie-demo-player>

  <script type="module">
    // Import the demo player (relative path from docs/demo/)
    import '../../../../demo-player/dist/index.js';

    // Import element components
    import Element from '../../dist/index.js';

    // Author component (previously "configure") - may not be available if blocked by ESM incompatibility
    // Use dynamic import with URL to bypass Vite's static analysis in dev mode
    let Configure;  // Note: Still called "Configure" in code for compatibility
    const configureUrl = new URL('../../dist/configure/index.js', import.meta.url).href;
    try {
      const configureModule = await import(/* @vite-ignore */ configureUrl);
      Configure = configureModule.default;
    } catch (e) {
      console.error('Author component not available:', e.message);
      alert('Author component is not available for this element. It may not be ready for ESM yet.');
    }

    // Controller module
    let controller;
    const controllerUrl = new URL('../../dist/controller/index.js', import.meta.url).href;
    try {
      controller = await import(/* @vite-ignore */ controllerUrl);
    } catch (e) {
      console.warn('Controller not available:', e.message);
    }

    // Import config and session data
    import config from './config.mjs';
    import sessions from './session.mjs';

    // Get the demo player element
    const player = document.querySelector('pie-demo-player');

    // Set the element definition
    player.element = {
      Element,
      Configure,
      controller,
    };

    // Set initial model (use first model from config)
    const model = Array.isArray(config?.models) ? config.models[0] : config;
    player.model = model;

    // Set initial session
    const session = Array.isArray(sessions) ? sessions[0] : sessions;
    player.session = session;

    // Start in CONFIGURE mode for author UI
    player.mode = 'configure';

    // Listen for session changes
    player.addEventListener('session-changed', (e) => {
      console.log('Session changed:', e.detail);
    });
  </script>
</body>
</html>
`;
}

// Backward compatibility aliases
export const generateStudentDemoHtml = generateDeliveryDemoHtml;
export const generateConfigureDemoHtml = generateAuthorDemoHtml;

/**
 * Legacy: Generate demo module JavaScript code (demo.mjs)
 *
 * @deprecated Use generateStudentDemoHtml and generateConfigureDemoHtml instead
 * This is kept for backward compatibility with old @pslb/demo-el system
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
 * Legacy: Generate demo HTML page for old @pslb/demo-el system
 *
 * @deprecated Use generateStudentDemoHtml and generateConfigureDemoHtml instead
 * This is kept for backward compatibility
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
