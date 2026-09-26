import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  collectPublishSurfaceViolations,
  collectSvelteLeakViolations,
} from '../scripts/check-publish-surface.mjs';
import { createPackageSnapshots } from '../scripts/lib/package-inspection.mjs';
import { runElementContractVerification } from '../scripts/verify-element-contracts.mjs';

async function makeWorkspaceFixture(): Promise<string> {
  const root = join(tmpdir(), `pie-package-inspection-${process.pid}-${Date.now()}`);
  await mkdir(join(root, 'packages', 'published', 'dist'), { recursive: true });
  await mkdir(join(root, 'packages', 'private'), { recursive: true });
  await mkdir(join(root, 'apps', 'demo'), { recursive: true });
  await mkdir(join(root, 'tools', 'cli', 'dist'), { recursive: true });
  await mkdir(join(root, 'tools', 'vite'), { recursive: true });

  await writeFile(
    join(root, 'package.json'),
    JSON.stringify(
      {
        workspaces: ['packages/*', 'tools/cli', 'apps/demo'],
      },
      null,
      2
    ),
    'utf8'
  );
  await writeFile(
    join(root, 'tools', 'vite', 'browser-esm-policy.json'),
    JSON.stringify({ allowedBareImports: [], sharedDependencyVersions: {} }, null, 2),
    'utf8'
  );
  await writeFile(
    join(root, 'packages', 'published', 'package.json'),
    JSON.stringify(
      {
        name: '@pie-test/published',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          '.': {
            default: './dist/index.js',
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );
  await writeFile(join(root, 'packages', 'published', 'dist', 'index.js'), 'export {};\n', 'utf8');
  await writeFile(
    join(root, 'packages', 'private', 'package.json'),
    JSON.stringify({ name: '@pie-test/private', private: true }, null, 2),
    'utf8'
  );
  await writeFile(
    join(root, 'apps', 'demo', 'package.json'),
    JSON.stringify({ name: '@pie-test/demo', version: '1.0.0' }, null, 2),
    'utf8'
  );
  await writeFile(
    join(root, 'tools', 'cli', 'package.json'),
    JSON.stringify(
      {
        name: '@pie-test/cli',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          '.': {
            default: './dist/index.js',
          },
        },
      },
      null,
      2
    ),
    'utf8'
  );
  await writeFile(join(root, 'tools', 'cli', 'dist', 'index.js'), 'export {};\n', 'utf8');

  return root;
}

describe('package inspection quality-gate helpers', () => {
  it('discovers publishable package and tool workspaces and packs each once', async () => {
    const root = await makeWorkspaceFixture();
    const packedPackages: string[] = [];

    const snapshots = createPackageSnapshots({
      root,
      includePackedFiles: true,
      packRunner: ({ pkg }) => {
        packedPackages.push(pkg.name);
        return JSON.stringify([{ files: [{ path: 'package.json' }, { path: 'dist/index.js' }] }]);
      },
    });

    expect(snapshots.map((snapshot) => snapshot.pkg.name)).toEqual([
      '@pie-test/published',
      '@pie-test/cli',
    ]);
    expect(packedPackages).toEqual(['@pie-test/published', '@pie-test/cli']);
    expect([...snapshots[0].packedFiles]).toEqual(['package.json', 'dist/index.js']);
  });

  it('reuses one package snapshot pass across aggregate package contract checks', async () => {
    const root = await makeWorkspaceFixture();
    let packCalls = 0;

    const result = runElementContractVerification({
      root,
      packRunner: () => {
        packCalls += 1;
        return JSON.stringify([{ files: [{ path: 'package.json' }, { path: 'dist/index.js' }] }]);
      },
      runChildProcess: () => ({ status: 0 }),
      log: () => {},
      error: () => {},
    });

    expect(result.ok).toBe(true);
    expect(packCalls).toBe(2);
    expect(result.steps.map((step) => step.name)).toEqual([
      'NPM packaging surface',
      'Controller package contract',
      'Runtime support export contract',
      'Sourcemap source contract',
    ]);
  });

  it('keeps runtime-support metadata checks out of publish-surface validation', () => {
    const violations = collectPublishSurfaceViolations({
      dir: join(process.cwd(), 'packages', 'elements-react', 'example'),
      relativeDir: 'packages/elements-react/example',
      pkg: {
        name: '@pie-element/example',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          '.': {
            default: './dist/index.js',
          },
        },
      },
      packedFiles: new Set(['package.json', 'dist/index.js']),
    });

    expect(violations).not.toContain(
      'non-browser-ESM element packages must expose exports["./runtime-support"] marking esm unsupported'
    );
  });

  it('requires browser shared dependency metadata only for browser outputs that import it', async () => {
    const root = await makeWorkspaceFixture();
    const svelteDir = join(root, 'packages', 'elements-svelte', 'simple-cloze');
    const reactDir = join(root, 'packages', 'elements-react', 'react-element');
    await mkdir(join(svelteDir, 'dist', 'browser', 'delivery'), { recursive: true });
    await mkdir(join(reactDir, 'dist', 'browser', 'delivery'), { recursive: true });
    await writeFile(
      join(svelteDir, 'dist', 'browser', 'delivery', 'index.js'),
      'export default class SimpleClozeElement extends HTMLElement {}\n',
      'utf8'
    );
    await writeFile(
      join(reactDir, 'dist', 'browser', 'delivery', 'index.js'),
      'import React from "react"; export default class ReactElement extends HTMLElement {}\n',
      'utf8'
    );

    const basePackage = {
      version: '1.0.0',
      files: ['dist'],
      exports: {
        './browser/delivery': {
          default: './dist/browser/delivery/index.js',
        },
      },
    };

    const svelteViolations = collectPublishSurfaceViolations({
      dir: svelteDir,
      relativeDir: 'packages/elements-svelte/simple-cloze',
      pkg: {
        ...basePackage,
        name: '@pie-element/simple-cloze',
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });
    const reactViolations = collectPublishSurfaceViolations({
      dir: reactDir,
      relativeDir: 'packages/elements-react/react-element',
      pkg: {
        ...basePackage,
        name: '@pie-element/react-element',
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });

    expect(svelteViolations).not.toContain(
      'pie.browserSharedDependencies.react must be "18.2.0" for browser ESM packages'
    );
    expect(reactViolations).toContain(
      'pie.browserSharedDependencies.react must be "18.2.0" for browser ESM packages'
    );
  });

  it('allows browser ESM packages to register private child custom elements only', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-react', 'composite');
    await mkdir(join(packageDir, 'dist', 'browser', 'delivery'), { recursive: true });
    await writeFile(
      join(packageDir, 'dist', 'browser', 'delivery', 'index.js'),
      'customElements.define("composite-private-child--version-1-0-0", class extends HTMLElement {});\n',
      'utf8'
    );

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-react/composite',
      pkg: {
        name: '@pie-element/composite',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          './browser/delivery': {
            default: './dist/browser/delivery/index.js',
          },
        },
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });

    expect(violations).not.toContain(
      'dist/browser/delivery/index.js must not auto-register the public element tag'
    );
  });

  it('measures the browser size budget over the reachable graph, not stale chunks', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-react', 'stale-chunks');
    await mkdir(join(packageDir, 'dist', 'browser', 'delivery'), { recursive: true });

    // Reachable payload: entry -> shared chunk, both tiny.
    await writeFile(
      join(packageDir, 'dist', 'browser', 'delivery', 'index.js'),
      'import "../shared-AAAAAAAA.js";\nexport default class extends HTMLElement {}\n',
      'utf8'
    );
    await writeFile(
      join(packageDir, 'dist', 'browser', 'shared-AAAAAAAA.js'),
      'export const shared = 1;\n',
      'utf8'
    );
    // Orphan left behind by an earlier build, larger than the whole budget.
    await writeFile(
      join(packageDir, 'dist', 'browser', 'shared-BBBBBBBB.js'),
      `export const stale = "${'x'.repeat(5 * 1024 * 1024)}";\n`,
      'utf8'
    );

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-react/stale-chunks',
      pkg: {
        name: '@pie-element/stale-chunks',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          './browser/delivery': {
            default: './dist/browser/delivery/index.js',
          },
        },
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });

    // The 5 MiB stale chunk must not be charged against the 4 MiB budget: the
    // tripwire exists to catch dependency drift in the real payload, and a
    // leftover chunk from an earlier build is not drift.
    expect(violations.some((violation) => violation.includes('exceeds policy budget'))).toBe(false);
  });

  it('still trips the browser size budget when the reachable payload itself is oversized', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-react', 'oversized');
    await mkdir(join(packageDir, 'dist', 'browser', 'delivery'), { recursive: true });

    // Entry pulls the oversized chunk in, so it counts as real payload drift.
    await writeFile(
      join(packageDir, 'dist', 'browser', 'delivery', 'index.js'),
      'import "../vendor-AAAAAAAA.js";\nexport default class extends HTMLElement {}\n',
      'utf8'
    );
    await writeFile(
      join(packageDir, 'dist', 'browser', 'vendor-AAAAAAAA.js'),
      `export const vendor = "${'x'.repeat(5 * 1024 * 1024)}";\n`,
      'utf8'
    );

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-react/oversized',
      pkg: {
        name: '@pie-element/oversized',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          './browser/delivery': {
            default: './dist/browser/delivery/index.js',
          },
        },
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });

    expect(violations.some((violation) => violation.includes('exceeds policy budget'))).toBe(true);
  });

  it('rejects browser stylesheets that no reachable module loads', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-react', 'styled');
    await mkdir(join(packageDir, 'dist', 'browser', 'delivery'), { recursive: true });
    await writeFile(
      join(packageDir, 'dist', 'browser', 'delivery', 'index.js'),
      'import "../shared-AAAAAAAA.js";\nexport default class extends HTMLElement {}\n',
      'utf8'
    );
    await writeFile(
      join(packageDir, 'dist', 'browser', 'shared-AAAAAAAA.js'),
      'await load([["0123456789abcdef","./shared.css"]]);\nexport const shared = 1;\n',
      'utf8'
    );
    await writeFile(join(packageDir, 'dist', 'browser', 'shared.css'), '.a{}\n', 'utf8');
    await writeFile(join(packageDir, 'dist', 'browser', 'extracted.css'), '.b{}\n', 'utf8');

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-react/styled',
      pkg: {
        name: '@pie-element/styled',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          './browser/delivery': {
            default: './dist/browser/delivery/index.js',
          },
        },
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });

    const stylesheetViolations = violations.filter((violation) => violation.includes('.css'));
    expect(stylesheetViolations).toEqual([
      'dist/browser/extracted.css is not loaded by any module reachable from the ./browser/* exports, and hosts load no element CSS',
    ]);
  });

  it('rejects legacy print stylesheets that module/print.js does not load', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-react', 'printable');
    await mkdir(join(packageDir, 'module'), { recursive: true });
    await writeFile(
      join(packageDir, 'module', 'print.js'),
      'await load([["0123456789abcdef","./index.css"]]);\nexport default class extends HTMLElement {}\n',
      'utf8'
    );
    await writeFile(join(packageDir, 'module', 'index.css'), '.a{}\n', 'utf8');
    await writeFile(join(packageDir, 'module', 'print.css'), '.b{}\n', 'utf8');

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-react/printable',
      pkg: {
        name: '@pie-element/printable',
        version: '1.0.0',
        files: ['dist', 'module', 'print.js'],
        exports: {
          './print': { default: './dist/print/index.js' },
          './print.js': { default: './dist/print/index.js' },
        },
      },
      packedFiles: new Set([
        'package.json',
        'module/print.js',
        'module/index.css',
        'module/print.css',
      ]),
    });

    const stylesheetViolations = violations.filter((violation) => violation.includes('.css'));
    expect(stylesheetViolations).toEqual([
      'module/print.css is not loaded by module/print.js, and hosts load no element CSS',
    ]);
  });

  it('rejects browser ESM packages that register their public element tag', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-react', 'public-registering');
    await mkdir(join(packageDir, 'dist', 'browser', 'delivery'), { recursive: true });
    await writeFile(
      join(packageDir, 'dist', 'browser', 'delivery', 'index.js'),
      'customElements.define("public-registering-element", class extends HTMLElement {});\n',
      'utf8'
    );

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-react/public-registering',
      pkg: {
        name: '@pie-element/public-registering',
        version: '1.0.0',
        files: ['dist'],
        exports: {
          './browser/delivery': {
            default: './dist/browser/delivery/index.js',
          },
        },
      },
      packedFiles: new Set(['package.json', 'dist/browser/delivery/index.js']),
    });

    expect(violations).toContain(
      'dist/browser/delivery/index.js must not auto-register the public element tag'
    );
  });

  it('rejects packed files that load svelte at runtime, not the comments of an inlined Svelte', async () => {
    const root = await makeWorkspaceFixture();
    const packageDir = join(root, 'packages', 'elements-svelte', 'leaky');
    await mkdir(join(packageDir, 'dist', 'delivery'), { recursive: true });
    // An element build that inlines Svelte also inlines Svelte's JSDoc.
    await writeFile(
      join(packageDir, 'dist', 'index.js'),
      [
        '//#region node_modules/svelte/src/internal/client/reactivity/batch.js',
        "/** @import { Fork } from 'svelte' */",
        "/**\n * import { createSubscriber } from 'svelte/reactivity';\n */",
        "export const framework = 'svelte';",
        '',
      ].join('\n'),
      'utf8'
    );
    await writeFile(
      join(packageDir, 'dist', 'delivery', 'index.js'),
      "import { mount } from 'svelte';\nexport * from 'svelte/store';\nexport default mount;\n",
      'utf8'
    );
    await writeFile(
      join(packageDir, 'dist', 'lazy.js'),
      "export const load = () => import('svelte/reactivity');\n",
      'utf8'
    );
    await writeFile(
      join(packageDir, 'dist', 'legacy.cjs'),
      "module.exports = require('svelte/internal');\n",
      'utf8'
    );

    const violations = collectPublishSurfaceViolations({
      dir: packageDir,
      relativeDir: 'packages/elements-svelte/leaky',
      pkg: {
        name: '@pie-element/leaky',
        version: '1.0.0',
        files: ['dist'],
        exports: { '.': { default: './dist/index.js' } },
      },
      packedFiles: new Set([
        'package.json',
        'dist/index.js',
        'dist/delivery/index.js',
        'dist/lazy.js',
        'dist/legacy.cjs',
      ]),
    });

    expect(violations).toEqual([
      'dist/delivery/index.js imports "svelte" at runtime; the build must inline Svelte',
      'dist/delivery/index.js imports "svelte/store" at runtime; the build must inline Svelte',
      'dist/lazy.js imports "svelte/reactivity" at runtime; the build must inline Svelte',
      'dist/legacy.cjs imports "svelte/internal" at runtime; the build must inline Svelte',
    ]);
  });

  it('rejects svelte in every dependency bucket except element-bundler dependencies', async () => {
    const root = await makeWorkspaceFixture();
    const bundlerDir = join(root, 'packages', 'bundler');
    await mkdir(join(bundlerDir, 'dist'), { recursive: true });
    await writeFile(
      join(bundlerDir, 'dist', 'index.js'),
      "import { compile } from 'svelte/compiler';\nexport { compile };\n",
      'utf8'
    );
    const svelte = '^5.57.0';

    expect(
      collectSvelteLeakViolations({
        dir: root,
        pkg: {
          name: '@pie-element/leaky',
          dependencies: { svelte },
          optionalDependencies: { svelte },
          peerDependencies: { svelte },
          peerDependenciesMeta: { svelte: { optional: true } },
        },
      })
    ).toEqual([
      'dependencies.svelte is not allowed',
      'optionalDependencies.svelte is not allowed',
      'peerDependencies.svelte is not allowed',
      'peerDependenciesMeta.svelte is not allowed',
    ]);
    expect(
      collectSvelteLeakViolations({
        dir: bundlerDir,
        pkg: { name: '@pie-element/element-bundler', dependencies: { svelte } },
        files: ['dist/index.js'],
      })
    ).toEqual([]);
    expect(
      collectSvelteLeakViolations({
        dir: bundlerDir,
        pkg: { name: '@pie-element/element-bundler', peerDependencies: { svelte } },
      })
    ).toEqual(['peerDependencies.svelte is not allowed']);
  });
});
