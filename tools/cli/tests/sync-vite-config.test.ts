import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatePieLibViteConfig } from '../src/lib/upstream/sync-vite-config.js';

describe('generatePieLibViteConfig presets', () => {
  it('uses math-rendering wrapper preset config', () => {
    const config = generatePieLibViteConfig('math-rendering');
    expect(config).toContain("id === '@pie-element/shared-math-rendering-mathjax'");
    expect(config).toContain("['debug'].includes(id)");
  });

  it('uses test-utils preset config', () => {
    const config = generatePieLibViteConfig('test-utils');
    expect(config).toContain('external: (id) =>');
    expect(config).toContain("formats: ['es']");
  });

  it('uses editable-html-tip-tap preset config', () => {
    const config = generatePieLibViteConfig('editable-html-tip-tap');
    expect(config).toContain('/^prosemirror-/.test(id)');
    expect(config).toContain('/^@tiptap\\//.test(id)');
  });

  it('uses default config for other packages', () => {
    const config = generatePieLibViteConfig('graphing');
    expect(config).toContain('external: (id) =>');
    expect(config).not.toContain('/^prosemirror-/.test(id)');
    expect(config).not.toContain("id === '@pie-element/shared-math-rendering-mathjax'");
  });
});

describe('shared element browser Vite config', () => {
  it('uses the shared browser ESM policy for externals and publish checks', async () => {
    const config = await readFile(
      join(process.cwd(), 'tools/vite/element-browser.config.ts'),
      'utf-8'
    );
    const policy = JSON.parse(
      await readFile(join(process.cwd(), 'tools/vite/browser-esm-policy.json'), 'utf-8')
    );
    const publishSurfaceCheck = await readFile(
      join(process.cwd(), 'scripts/check-publish-surface.mjs'),
      'utf-8'
    );

    expect(policy.allowedBareImports).toEqual([
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
    ]);
    expect(policy.sharedDependencyVersions).toEqual({
      react: '18.2.0',
      'react-dom': '18.2.0',
    });
    expect(policy.maxBrowserJsBytesPerPackage).toBeGreaterThan(0);
    expect(config).toContain('browser-esm-policy.json');
    expect(config).toContain('external:');
    expect(config).toContain('allowedBareImports.has(id)');
    expect(publishSurfaceCheck).toContain('browser-esm-policy.json');
    expect(publishSurfaceCheck).toContain('allowedBrowserBareImports.has(specifier)');
    expect(publishSurfaceCheck).toContain('maxBrowserJsBytesPerPackage');
  });
});
