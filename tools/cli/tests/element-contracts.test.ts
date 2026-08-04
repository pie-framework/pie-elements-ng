import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PIE element contract documentation and verifier', () => {
  it('declares the canonical JS and packaging contract', async () => {
    const contract = await readFile(join(process.cwd(), 'docs/PIE_ELEMENT_CONTRACT.md'), 'utf-8');

    expect(contract).toContain('# PIE Element Contract');
    expect(contract).toContain('## JavaScript Runtime Contract');
    expect(contract).toContain('## NPM Packaging Contract');
    expect(contract).toContain('## Runtime Strategy Contract');
    expect(contract).toContain('pie.browserSharedDependencies');
    expect(contract).toContain('controller.js');
    expect(contract).toContain('preloaded');
  });

  it('provides one verifier command for contract checks', async () => {
    const verifier = await readFile(
      join(process.cwd(), 'scripts/verify-element-contracts.mjs'),
      'utf-8'
    );
    const pkg = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf-8'));

    expect(pkg.scripts['verify:element-contracts']).toBe(
      'bun ./scripts/verify-element-contracts.mjs'
    );
    expect(pkg.scripts['lint:all']).toContain('verify:element-contracts');
    expect(pkg.scripts['release:publish']).toContain('verify:element-contracts');
    expect(verifier).toContain('check-publish-surface.mjs');
    expect(verifier).toContain('verify-runtime-support-exports.mjs');
    expect(verifier).toContain('check-sourcemap-sources.mjs');
    expect(verifier).toContain('verify:controllers');
  });

  it('keeps runtime-support metadata validation in the aggregate verifier', async () => {
    const verifier = await readFile(
      join(process.cwd(), 'scripts/verify-element-contracts.mjs'),
      'utf-8'
    );

    expect(verifier).toContain('Runtime support export contract');
    expect(verifier).toContain('verify-runtime-support-exports.mjs');
  });
});
