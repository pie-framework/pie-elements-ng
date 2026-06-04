/**
 * Vite configuration generation for sync operations
 */
import { collectEntryPoints, detectEntryFile } from './sync-entry-discovery.js';
import { createExternalFunction } from './sync-externals.js';
import { getPieLibVitePreset } from './sync-presets.js';

/**
 * Detect entry points for an element package
 */
export function detectElementEntryPoints(elementDir: string): Record<string, string> {
  return collectEntryPoints(elementDir, [
    ['index', 'src/index'],
    ['controller/index', 'src/controller/index'],
    ['configure/index', 'src/configure/index'],
    ['delivery/index', 'src/delivery/index'],
  ]);
}

/**
 * Generate Vite config content for an element package
 */
export function generateElementViteConfig(entryPoints: Record<string, string>): string {
  if (Object.keys(entryPoints).length === 0) {
    throw new Error('No entry points found for element');
  }

  const entryJson = JSON.stringify(entryPoints, null, 8).replace(/^/gm, '      ');

  return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  // Demo mode: serve the docs/demo directory
  if (mode === 'demo') {
    return {
      plugins: [react()],
      root: 'docs/demo',
      server: {
        port: 5174,
      },
    };
  }

  // Build mode: build the library
  return {
    plugins: [react()],
    build: {
      lib: {
        entry: ${entryJson.trimStart()},
        formats: ['es'],
      },
      rollupOptions: {
        external: ${createExternalFunction('element')},
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
        },
      },
    },
  };
});
`;
}

/**
 * Generate Vite config content for a pie-lib package
 */
export function generatePieLibViteConfig(packageName?: string, packageDir?: string): string {
  // Detect entry point extension if package directory provided
  let entryPoint = 'src/index.ts';
  if (packageDir) {
    entryPoint = detectEntryFile(packageDir, 'src/index') ?? entryPoint;
  }

  const preset = getPieLibVitePreset(packageName);

  // Special config for math-rendering wrapper (externalizes adapter package)
  if (preset === 'math-rendering-wrapper') {
    return `import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, '${entryPoint}'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        return (
          /^@pie-element\\/shared-/.test(id) ||
          id === '@pie-element/shared-math-rendering-mathjax' ||
          /^@pie-lib\\//.test(id) ||
          ['debug'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;
  }

  // Special config for test-utils (includes testing library externals)
  if (preset === 'test-utils') {
    return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, '${entryPoint}'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ${createExternalFunction('pielib')},
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;
  }

  // Special config for editable-html-tip-tap (externalizes prosemirror and tiptap)
  if (preset === 'editable-html-tip-tap') {
    return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, '${entryPoint}'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
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
          /^styled-components/.test(id) ||
          id === 'konva' || /^konva\\//.test(id) ||
          id === 'react-konva' || /^react-konva\\//.test(id) ||
          id === '@mdi/react' || /^@mdi\\/react\\//.test(id) ||
          id === '@mdi/js' || /^@mdi\\/js\\//.test(id) ||
          /^prosemirror-/.test(id) ||
          /^@tiptap\\//.test(id) ||
          ['prop-types', 'debug', 'i18next', 'humps', 'mathjs', 'react-jss', 'js-combinatorics', '@dnd-kit/core', 'react-transition-group'].includes(id)
        );
      },
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;
  }

  // Default pie-lib config
  return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, '${entryPoint}'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ${createExternalFunction('pielib', {
        externalizeMathjs: packageName !== 'config-ui',
      })},
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;
}
