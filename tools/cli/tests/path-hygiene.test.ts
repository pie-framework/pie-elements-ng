import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();

function readWorkspaceFile(path: string): string {
  return readFileSync(join(repoRoot, path), 'utf8');
}

describe('path hygiene', () => {
  it('keeps demo workspace root discovery marker-based', () => {
    const bundleApi = readWorkspaceFile('apps/element-demo/src/routes/api/bundle/+server.ts');
    const iifeContract = readWorkspaceFile(
      'apps/element-demo/scripts/test-iife-bundle-contract.ts'
    );

    expect(bundleApi).not.toContain("process.cwd(), '..', '..'");
    expect(iifeContract).not.toContain("process.cwd(), '..', '..'");
    expect(bundleApi).toContain('findWorkspaceRoot(process.cwd())');
    expect(iifeContract).toContain('findWorkspaceRoot(process.cwd())');
  });

  it('does not publish stale Verdaccio package paths', () => {
    const verdaccioTest = readWorkspaceFile(
      'packages/shared/bundler-shared/tests/run-verdaccio-test.ts'
    );
    const verdaccioShellTest = readWorkspaceFile(
      'packages/shared/bundler-shared/tests/test-with-verdaccio.sh'
    );

    expect(verdaccioTest).not.toContain('../../math-engine');
    expect(verdaccioTest).not.toContain('../../../elements-react/text-entry');
    expect(verdaccioShellTest).not.toContain('packages/shared/math-engine');
    expect(verdaccioShellTest).not.toContain('packages/elements-react/text-entry');
    expect(verdaccioTest).toContain('resolveWorkspacePackage');
    expect(verdaccioShellTest).toContain('find_workspace_root');
    expect(verdaccioShellTest).toContain('resolve_workspace_package');
    expect(verdaccioShellTest).toContain('VERDACCIO_TEST_PACKAGE');
    expect(verdaccioShellTest).toContain(`\${TEST_PACKAGE}`);
    expect(verdaccioShellTest).not.toContain("{ name: '@pie-element/multiple-choice'");
  });

  it('keeps esm player test checkout paths configurable', () => {
    const viteConfig = readWorkspaceFile('apps/esm-player-test/vite.config.js');

    expect(viteConfig).not.toContain("allow: ['../..', '../../../pie-players']");
    expect(viteConfig).toContain('PIE_PLAYERS_ROOT');
    expect(viteConfig).toContain('monorepoRoot');
  });
});
