#!/usr/bin/env node
/**
 * One-time script to add vite.config.ts and build scripts to existing pie-lib packages
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function generateViteConfig(entryExt) {
  return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.${entryExt}'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => {
        return (
          /^react($|\\/)/.test(id) ||
          /^react-dom($|\\/)/.test(id) ||
          /^@pie-lib\\//.test(id) ||
          /^@pie-elements-ng\\//.test(id) ||
          /^@pie-framework\\//.test(id) ||
          /^@mui\\//.test(id) ||
          /^@emotion\\//.test(id) ||
          /^d3-/.test(id) ||
          id === 'lodash' ||
          /^lodash\\//.test(id) ||
          ['prop-types', 'classnames', 'debug'].includes(id)
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

const pieLibDir = 'packages/lib-react';
const packages = [
  'categorize',
  'config-ui',
  'correct-answer-toggle',
  'drag',
  'editable-html',
  'icons',
  'math-input',
  'math-rendering',
  'math-toolbar',
  'render-ui',
  'test-utils',
  'translator',
];

let updated = 0;

for (const pkg of packages) {
  const pkgDir = join(pieLibDir, pkg);

  if (!existsSync(pkgDir)) {
    console.log(`⏭️  ${pkg}: directory not found`);
    continue;
  }

  // Detect entry point extension
  let entryExt = 'ts';
  if (existsSync(join(pkgDir, 'src/index.tsx'))) {
    entryExt = 'tsx';
  } else if (existsSync(join(pkgDir, 'src/index.ts'))) {
    entryExt = 'ts';
  } else {
    console.log(`⏭️  ${pkg}: no index.ts or index.tsx found`);
    continue;
  }

  // Add vite.config.ts if missing or incorrect
  const viteConfigPath = join(pkgDir, 'vite.config.ts');
  const expectedViteConfig = generateViteConfig(entryExt);

  const currentViteConfig = existsSync(viteConfigPath)
    ? await readFile(viteConfigPath, 'utf-8')
    : null;

  if (currentViteConfig !== expectedViteConfig) {
    await writeFile(viteConfigPath, expectedViteConfig, 'utf-8');
    console.log(
      `✅ ${pkg}: ${currentViteConfig ? 'updated' : 'added'} vite.config.ts (entry: index.${entryExt})`
    );
    updated++;
  }

  // Update package.json to add build scripts
  const pkgJsonPath = join(pkgDir, 'package.json');
  if (existsSync(pkgJsonPath)) {
    const content = await readFile(pkgJsonPath, 'utf-8');
    const pkgJson = JSON.parse(content);

    let modified = false;
    if (!pkgJson.scripts) {
      pkgJson.scripts = {};
      modified = true;
    }

    if (!pkgJson.scripts.build) {
      pkgJson.scripts.build = 'bun x vite build && bun x tsc --emitDeclarationOnly';
      modified = true;
    }

    if (!pkgJson.scripts.dev) {
      pkgJson.scripts.dev = 'bun x vite';
      modified = true;
    }

    if (!pkgJson.scripts.test) {
      pkgJson.scripts.test = 'bun x vitest run';
      modified = true;
    }

    if (modified) {
      await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');
      console.log(`✅ ${pkg}: updated package.json scripts`);
      updated++;
    }
  }
}

console.log(`\n✨ Updated ${updated} package file(s)`);
console.log('\nNext steps:');
console.log('  1. bun run build --filter=@pie-element/categorize...');
console.log('  2. bun react-demo --element categorize');
