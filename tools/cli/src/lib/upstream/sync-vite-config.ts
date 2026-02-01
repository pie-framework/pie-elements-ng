/**
 * Vite configuration generation for sync operations
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createExternalFunction } from './sync-externals.js';

/**
 * Detect the actual file extension for a source file
 */
function detectFileExtension(basePath: string): string | null {
  if (existsSync(`${basePath}.tsx`)) return '.tsx';
  if (existsSync(`${basePath}.ts`)) return '.ts';
  return null;
}

/**
 * Detect entry points for an element package
 */
export function detectElementEntryPoints(elementDir: string): Record<string, string> {
  const entryPoints: Record<string, string> = {};

  // Main index
  const indexExt = detectFileExtension(join(elementDir, 'src/index'));
  if (indexExt) {
    entryPoints.index = `src/index${indexExt}`;
  }

  // Controller
  const controllerExt = detectFileExtension(join(elementDir, 'src/controller/index'));
  if (controllerExt) {
    entryPoints['controller/index'] = `src/controller/index${controllerExt}`;
  }

  // Configure
  const configureExt = detectFileExtension(join(elementDir, 'src/configure/index'));
  if (configureExt) {
    entryPoints['configure/index'] = `src/configure/index${configureExt}`;
  }

  // Delivery
  const deliveryExt = detectFileExtension(join(elementDir, 'src/delivery/index'));
  if (deliveryExt) {
    entryPoints['delivery/index'] = `src/delivery/index${deliveryExt}`;
  }

  return entryPoints;
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
    const ext = detectFileExtension(join(packageDir, 'src/index'));
    if (ext) {
      entryPoint = `src/index${ext}`;
    }
  }

  // Special config for math-rendering wrapper (externalizes adapter package)
  if (packageName === 'math-rendering') {
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
  if (packageName === 'test-utils') {
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
  if (packageName === 'editable-html-tip-tap') {
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
          id === 'lodash-es' ||
          /^lodash-es\\//.test(id) ||
          /^styled-components/.test(id) ||
          id === 'konva' || /^konva\\//.test(id) ||
          id === 'react-konva' || /^react-konva\\//.test(id) ||
          id === '@mdi/react' || /^@mdi\\/react\\//.test(id) ||
          id === '@mdi/js' || /^@mdi\\/js\\//.test(id) ||
          /^prosemirror-/.test(id) ||
          /^@tiptap\\//.test(id) ||
          ['prop-types', 'classnames', 'debug', 'i18next', 'humps', 'mathjs', 'react-jss', 'js-combinatorics', '@dnd-kit/core', 'react-transition-group'].includes(id)
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
