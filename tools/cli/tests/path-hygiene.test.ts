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

  it('keeps esm player test checkout paths configurable', () => {
    const viteConfig = readWorkspaceFile('apps/esm-player-test/vite.config.js');

    expect(viteConfig).not.toContain("allow: ['../..', '../../../pie-players']");
    expect(viteConfig).toContain('PIE_PLAYERS_ROOT');
    expect(viteConfig).toContain('monorepoRoot');
  });
});
