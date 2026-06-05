import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { collectPublishSurfaceViolations } from '../scripts/check-publish-surface.mjs';
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
});
