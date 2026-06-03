import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { load } from '../src/routes/[element]/controller-source/+page';

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const controllerSourceRouteDir = resolve(
  workspaceRoot,
  'apps/element-demo/src/routes/[element]/controller-source'
);
const controllerSourceRouteFile = resolve(controllerSourceRouteDir, '+page.ts');
const viteConfigFile = resolve(workspaceRoot, 'apps/element-demo/vite.config.ts');

describe('element demo controller source route', () => {
  it('uses a workspace-root alias for controller source discovery', () => {
    const routeSource = readFileSync(controllerSourceRouteFile, 'utf8');
    const viteConfig = readFileSync(viteConfigFile, 'utf8');

    expect(routeSource).toContain(
      "'@workspace/packages/elements-{react,svelte}/*/src/controller/index.{ts,tsx,js,jsx}'"
    );
    expect(viteConfig).toContain("'@workspace': workspaceRoot");
  });

  it('does not duplicate route-relative traversal when matching globbed modules', () => {
    const routeSource = readFileSync(controllerSourceRouteFile, 'utf8');

    expect(routeSource).not.toMatch(/modulePath\s*=\s*`[^`]*\.\.\/[^`]*packages\//);
  });

  it('loads real controller source through the workspace glob', async () => {
    const result = await load({
      params: { element: 'multiple-choice' },
      parent: async () => ({ packageName: '@pie-element/multiple-choice' }),
    } as never);

    expect(result.controllerSourceAvailable).toBe(true);
    if (!result.controllerSourceAvailable) {
      throw new Error('Expected multiple-choice controller source to be available');
    }
    expect(result.sourcePath).toBe(
      'packages/elements-react/multiple-choice/src/controller/index.ts'
    );
    expect(result.esmSpecifier).toBe('@pie-element/multiple-choice/controller');
    expect(result.compatibilitySpecifier).toBe('@pie-element/multiple-choice/controller.js');
    expect(result.source).toContain('model');
  });
});
