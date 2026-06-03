import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverElementViews, isElementViewExport } from '../src/lib/utils/view-discovery';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const viewDiscoveryFile = resolve(
  workspaceRoot,
  'apps/learnosity-parity-demo/src/lib/utils/view-discovery.ts'
);
const viteConfigFile = resolve(workspaceRoot, 'apps/learnosity-parity-demo/vite.config.ts');

describe('learnosity parity demo view discovery', () => {
  it('treats only user-facing exports as demo views', () => {
    expect(isElementViewExport('./author')).toBe(true);
    expect(isElementViewExport('./print')).toBe(true);
    expect(isElementViewExport('./delivery-mobile')).toBe(true);

    expect(isElementViewExport('.')).toBe(false);
    expect(isElementViewExport('./delivery')).toBe(false);
    expect(isElementViewExport('./browser/delivery')).toBe(false);
    expect(isElementViewExport('./browser/author')).toBe(false);
    expect(isElementViewExport('./browser/controller')).toBe(false);
    expect(isElementViewExport('./configure')).toBe(false);
    expect(isElementViewExport('./controller')).toBe(false);
    expect(isElementViewExport('./controller.js')).toBe(false);
    expect(isElementViewExport('./runtime-support')).toBe(false);
  });

  it('uses a workspace-root alias for package discovery', () => {
    const source = readFileSync(viewDiscoveryFile, 'utf8');
    const viteConfig = readFileSync(viteConfigFile, 'utf8');

    expect(source).toContain("'@workspace/packages/elements-{react,svelte}/*/package.json'");
    expect(source).not.toContain('../../../../../packages/');
    expect(viteConfig).toContain("'@workspace': workspaceRoot");
  });

  it('discovers real package views while hiding compatibility exports', async () => {
    const views = await discoverElementViews('multiple-choice');
    const viewIds = views.map((view) => view.id);

    expect(viewIds).toContain('author');
    expect(viewIds).toContain('print');
    expect(viewIds).not.toContain('configure');
    expect(viewIds).not.toContain('controller');
    expect(viewIds).not.toContain('controller.js');
    expect(viewIds.some((viewId) => viewId.startsWith('browser/'))).toBe(false);
  });
});
