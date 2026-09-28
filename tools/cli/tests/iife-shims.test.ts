import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  IIFE_DEBUG_SHIM_SOURCE,
  IIFE_PROP_TYPES_SHIM_SOURCE,
} from '../src/lib/upstream/sync-constants.js';

// Runs `probe` against the shim as a real ES module, the way the IIFE build consumes it.
const runAgainstShim = (source: string, probe: string) =>
  execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `const mod = await import('data:text/javascript,' + encodeURIComponent(${JSON.stringify(source)}));\n${probe}`,
    ],
    { encoding: 'utf-8' }
  ).trim();

describe('IIFE module shims', () => {
  it('prop-types shim supports chained validators at module load', () => {
    const out = runAgainstShim(
      IIFE_PROP_TYPES_SHIM_SOURCE,
      `const P = mod.default;
      const chained = [P.string.isRequired, P.oneOf(['a']).isRequired, P.shape({ a: P.string }).isRequired,
        P.arrayOf(P.number).isRequired, P.oneOfType([P.string]).isRequired, mod.oneOf(['a']).isRequired];
      console.log(chained.every((v) => typeof v === 'function') && P.PropTypes === P);`
    );
    expect(out).toBe('true');
  });

  it('debug shim supports module-level and instance calls', () => {
    const out = runAgainstShim(
      IIFE_DEBUG_SHIM_SOURCE,
      `const debug = mod.default; debug.log('m'); const log = debug('pie-element:test'); log('m');
      log.extend('child')('m'); console.log(log.enabled === false);`
    );
    expect(out).toBe('true');
  });

  it('every checked-in React element IIFE config uses the shared shims', async () => {
    const root = join(process.cwd(), 'packages/elements-react');
    const configs: string[] = [];
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const config = await readFile(join(root, entry.name, 'vite.config.iife.ts'), 'utf-8').catch(
        () => null
      );
      if (config === null) continue;
      configs.push(entry.name);
      expect(config, entry.name).toContain(JSON.stringify(IIFE_DEBUG_SHIM_SOURCE));
      expect(config, entry.name).toContain(JSON.stringify(IIFE_PROP_TYPES_SHIM_SOURCE));
    }
    expect(configs.length).toBeGreaterThan(0);
  });
});
