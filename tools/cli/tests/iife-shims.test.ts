import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { IIFE_DEBUG_SHIM_SOURCE, IIFE_PROP_TYPES_SHIM_SOURCE } from '../../vite/iife-shims.ts';

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

  it('every React element with an IIFE entry builds it with the shared config', async () => {
    const root = join(process.cwd(), 'packages/elements-react');
    const packages: string[] = [];
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const iifeEntry = await readFile(join(root, entry.name, 'src/index.iife.ts'), 'utf-8').catch(
        () => null
      );
      if (iifeEntry === null) continue;
      packages.push(entry.name);
      const { scripts } = JSON.parse(
        await readFile(join(root, entry.name, 'package.json'), 'utf-8')
      ) as { scripts?: Record<string, string> };
      expect(scripts?.build, entry.name).toContain(
        '--config ../../../tools/vite/element-iife.config.ts'
      );
    }
    expect(packages.length).toBeGreaterThan(0);
  });
});
