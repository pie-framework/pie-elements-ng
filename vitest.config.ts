import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { globSync } from 'glob';
import { defineConfig } from 'vitest/config';

const workspaceRoot = dirname(fileURLToPath(import.meta.url));

const hasTests = (dir: string, include: string) =>
  globSync(include, { cwd: join(workspaceRoot, dir), ignore: '**/node_modules/**' }).length > 0;

// React suites build through their package's own vite config: the React plugin, ESM-first
// resolution and, for elements, the per-package `define`s. Each package with tests is its own
// project, so a new suite runs without being registered. An element's `tests/` directory stays in
// the workspace project: it exercises the published delivery element and needs no package config.
const reactPackageProjects = [
  { tree: 'packages/lib-react', include: '**/*.test.{ts,tsx}' },
  { tree: 'packages/elements-react', include: 'src/**/*.test.{ts,tsx}' },
].flatMap(({ tree, include }) =>
  globSync(`${tree}/*/vite.config.ts`, { cwd: workspaceRoot })
    .map((config) => dirname(config))
    .filter((dir) => hasTests(dir, include))
    .sort()
    .map((dir) => ({
      extends: join(workspaceRoot, dir, 'vite.config.ts'),
      root: join(workspaceRoot, dir),
      test: {
        name: dir.replace('packages/', ''),
        include: [include],
        globals: true,
        environment: 'happy-dom' as const,
        setupFiles: [join(workspaceRoot, 'vitest.setup.ts')],
      },
    }))
);

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@workspace': workspaceRoot,
    },
    conditions: process.env.VITEST ? ['browser'] : [],
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.svelte-kit/**',
      '**/.bun-tests/**',
      // Agent worktrees are full checkouts; the root-anchored excludes below miss their copies.
      '.claude/**',
      '**/e2e/**', // Exclude E2E tests (use Playwright for those)
      '**/tests/e2e/**', // Exclude E2E tests in tests directory
      '**/*.spec.ts', // Exclude Playwright spec files
      // Run by `reactPackageProjects` under their package's config.
      'packages/elements-react/**/src/**',
      'packages/lib-react/**',
    ],
    projects: [{ extends: true, test: { name: 'workspace' } }, ...reactPackageProjects],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build/',
        '.svelte-kit/',
        '**/*.config.{js,ts}',
        '**/*.spec.{js,ts}',
        '**/*.test.{js,ts}',
      ],
    },
  },
});
