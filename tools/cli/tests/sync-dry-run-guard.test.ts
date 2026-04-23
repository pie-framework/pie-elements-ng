import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('upstream sync dry-run guard', () => {
  it('keeps a top-level dry-run no-write branch in sync command', () => {
    const source = readFileSync(
      join(process.cwd(), 'tools/cli/src/commands/upstream/sync.ts'),
      'utf-8'
    );

    const dryRunIdx = source.indexOf('if (config.dryRun)');
    const strategyIdx = source.indexOf('// Execute sync strategies');
    const writeIdx = source.indexOf('await this.rewriteWorkspaceDependencies(config);');

    expect(dryRunIdx).toBeGreaterThan(-1);
    expect(strategyIdx).toBeGreaterThan(-1);
    expect(writeIdx).toBeGreaterThan(-1);
    expect(dryRunIdx).toBeLessThan(strategyIdx);
    expect(dryRunIdx).toBeLessThan(writeIdx);
    expect(source).toContain('No files will be modified.');
  });
});
