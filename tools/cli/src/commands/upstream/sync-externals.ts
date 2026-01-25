/**
 * Shared external dependency configuration for Vite builds
 *
 * These dependencies should NOT be bundled into library outputs.
 * Instead, they are resolved at runtime from the consuming application.
 */

/**
 * Check if a module ID should be treated as external (not bundled)
 *
 * Categories of externals:
 * 1. Framework peer dependencies (React, MUI, Emotion) - MUST be external to avoid duplicate instances
 * 2. Internal monorepo packages (@pie-lib, @pie-element, @pie-element) - External for separate resolution
 * 3. Utility libraries (prop-types, classnames, debug) - External to reduce duplication across packages
 * 4. Specialized UI libraries (@dnd-kit, react-transition-group, styled-components) - External to avoid version conflicts
 * 5. Lodash variants (lodash/lodash-es) - External for runtime resolution via import maps
 * 6. D3 modules - External as they're commonly shared
 */
export function isExternal(id: string, variant: 'element' | 'pielib'): boolean {
  // React and React DOM - always external (peer dependencies)
  if (/^react($|\/)/.test(id)) return true;
  if (/^react-dom($|\/)/.test(id)) return true;

  // Internal monorepo packages - always external
  if (/^@pie-lib\//.test(id)) return true;
  if (/^@pie-element\//.test(id)) return true;
  if (/^@pie-element\//.test(id)) return true;
  if (/^@pie-framework\//.test(id)) return true;

  // UI framework packages - always external (peer dependencies)
  if (/^@mui\//.test(id)) return true;
  if (/^@emotion\//.test(id)) return true;

  // D3 visualization modules - always external
  if (/^d3-/.test(id)) return true;

  // Testing libraries - always external
  if (/^@testing-library\//.test(id)) return true;

  // Lodash - variant-specific (elements use lodash, pie-lib uses lodash-es)
  if (variant === 'element') {
    if (id === 'lodash') return true;
    if (/^lodash\//.test(id)) return true;
  } else {
    if (id === 'lodash-es') return true;
    if (/^lodash-es\//.test(id)) return true;
  }

  // Styled-components - external to avoid multiple instances
  if (/^styled-components/.test(id)) return true;

  // Konva visualization library - external for hotspot/drawing-response
  if (id === 'konva' || id.startsWith('konva/')) return true;
  if (id === 'react-konva' || id.startsWith('react-konva/')) return true;

  // Common utility and UI libraries - always external
  const commonExternals = [
    'prop-types', // React prop validation
    'classnames', // CSS class utility
    'debug', // Debug logging
    'i18next', // Internationalization
    'humps', // String case conversion
    'mathjs', // Math expression evaluation
    'react-jss', // JSS styling for React
    'js-combinatorics', // Combinatorics library
    '@dnd-kit/core', // Drag and drop
    'react-transition-group', // Animations
  ];

  return commonExternals.includes(id);
}

/**
 * Generate external function for Vite rollupOptions
 * Use this in vite.config.ts generation
 */
export function createExternalFunction(variant: 'element' | 'pielib'): string {
  const lodashCheck =
    variant === 'element'
      ? `id === 'lodash' ||
          /^lodash\\//.test(id) ||`
      : `id === 'lodash-es' ||
          /^lodash-es\\//.test(id) ||`;

  return `(id) => {
        return (
          /^react($|\\/)/.test(id) ||
          /^react-dom($|\\/)/.test(id) ||
          /^@pie-lib\\//.test(id) ||
          /^@pie-element\\//.test(id) ||
          /^@pie-element\\//.test(id) ||
          /^@pie-framework\\//.test(id) ||
          /^@mui\\//.test(id) ||
          /^@emotion\\//.test(id) ||
          /^d3-/.test(id) ||
          /^@testing-library\\//.test(id) ||
          ${lodashCheck}
          /^styled-components/.test(id) ||
          id === 'konva' || /^konva\\//.test(id) ||
          id === 'react-konva' || /^react-konva\\//.test(id) ||
          id === '@mdi/react' || /^@mdi\\/react\\//.test(id) ||
          id === '@mdi/js' || /^@mdi\\/js\\//.test(id) ||
          ['prop-types', 'classnames', 'debug', 'i18next', 'humps', 'mathjs', 'react-jss', 'js-combinatorics', '@dnd-kit/core', 'react-transition-group'].includes(id)
        );
      }`;
}

/**
 * Generate external function for Konva-based elements (preserveModules: false)
 * These bundle konva, react-konva, scheduler, and react-reconciler to avoid runtime resolution issues
 */
export function createKonvaExternalFunction(): string {
  return `(id) => {
        // Bundle konva, react-konva, scheduler, and react-reconciler
        // Check these FIRST before other react checks
        if (id === 'konva' || id.startsWith('konva/')) return false;
        if (id === 'react-konva' || id.startsWith('react-konva/')) return false;
        if (id === 'scheduler' || id.startsWith('scheduler/')) return false;
        if (id === 'react-reconciler' || id.startsWith('react-reconciler/')) return false;

        // Always external: base package names
        if (id === 'react' || id.startsWith('react/')) return true;
        if (id === 'react-dom' || id.startsWith('react-dom/')) return true;
        if (id.startsWith('@pie-lib/')) return true;
        if (id.startsWith('@pie-element/')) return true;
        if (id.startsWith('@pie-element/')) return true;
        if (id.startsWith('@pie-framework/')) return true;
        if (id.startsWith('@mui/')) return true;
        if (id.startsWith('@emotion/')) return true;
        if (id.startsWith('d3-')) return true;
        // Keep lodash external even with preserveModules: false
        // It will be resolved via import map in demo HTML
        if (id === 'lodash' || id.startsWith('lodash/')) return true;
        if (id === 'styled-components' || id.startsWith('styled-components/')) return true;
        // Material Design Icons for drawing-response
        if (id === '@mdi/react' || id.startsWith('@mdi/react/')) return true;
        if (id === '@mdi/js' || id.startsWith('@mdi/js/')) return true;
        if (['prop-types', 'classnames', 'debug', 'humps', 'mathjs', 'react-jss', 'js-combinatorics', '@dnd-kit/core', 'react-transition-group'].includes(id)) return true;

        // Everything else gets bundled (including dependencies of konva/react-konva)
        return false;
      }`;
}
