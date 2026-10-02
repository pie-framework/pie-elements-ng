import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Module source substituted for `debug` in per-element IIFE builds. Carries the
 * module-level `debug.log` and the instance methods element code calls.
 */
const IIFE_DEBUG_SHIM_SOURCE =
  "const noop = () => {}; function debug() { const log = function () {}; log.enabled = false; log.log = noop; log.extend = () => log; log.destroy = noop; return log; } debug.log = noop; debug.enable = noop; debug.disable = () => ''; debug.enabled = () => false; export default debug;";

/**
 * Module source substituted for `prop-types` in per-element IIFE builds. It mirrors
 * prop-types' production shims: every validator is callable and carries `isRequired`,
 * so `PropTypes.oneOf([...]).isRequired` evaluates at module load.
 */
const IIFE_PROP_TYPES_SHIM_SOURCE =
  'const shim = function () { return null; }; shim.isRequired = shim; const getShim = () => shim; export const array = shim, bigint = shim, bool = shim, func = shim, number = shim, object = shim, string = shim, symbol = shim, any = shim, element = shim, elementType = shim, node = shim; export const arrayOf = getShim, instanceOf = getShim, objectOf = getShim, oneOf = getShim, oneOfType = getShim, shape = getShim, exact = getShim; export const checkPropTypes = () => {}; export const resetWarningCache = () => {}; const types = { array, bigint, bool, func, number, object, string, symbol, any, element, elementType, node, arrayOf, instanceOf, objectOf, oneOf, oneOfType, shape, exact, checkPropTypes, resetWarningCache }; types.PropTypes = types; export { types as PropTypes }; export default types;';

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
