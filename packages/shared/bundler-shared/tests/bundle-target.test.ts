// @vitest-environment node
/**
 * Runs the shared scoring code compiled to the bundle target and checks it decides exactly as the
 * uncompiled code does. Vitest and the repo's Vite builds run the code at es2020 or newer, so a
 * dependency upgrade or new code that breaks only once lowered (`10n ** n` becomes `Math.pow`,
 * which throws on a BigInt: PIE-1006, PIE-1513) would pass every other check and ship.
 *
 * The whole bundle, dependencies included, compiles to the target: the pie-api-aws bundler
 * lowers dependencies too. To guard another shared package, add a probe.
 */
import { globSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import { describe, expect, it } from 'vitest';
import { BUNDLE_TARGET } from '../src/target.js';

// The esbuild that esbuild-loader, and so the bundler, compiles with. It is not a dependency of
// this package, so its types are not either; this is the part the test uses.
type Esbuild = {
  build(options: Record<string, unknown>): Promise<{ outputFiles: { text: string }[] }>;
};
const esbuild: Esbuild = createRequire(createRequire(import.meta.url).resolve('esbuild-loader'))(
  'esbuild'
);

type Probe = {
  name: string;
  /** The directory the entry's imports resolve from. */
  resolveDir: string;
  /**
   * The entry module. Its default export returns `[case, result]` pairs, recording a thrown
   * error as a result so one error does not hide the cases after it.
   */
  entry: () => string;
};

const mathValidationSrc = fileURLToPath(new URL('../../math-validation/src/', import.meta.url));

const probes: Probe[] = [
  {
    name: 'math-validation latexEqual fixtures',
    resolveDir: mathValidationSrc,
    entry: () => {
      const files = globSync('fixtures/latex-equal/**/*.ts', { cwd: mathValidationSrc }).sort();
      return `
        import { latexEqual } from './index.ts';
        ${files.map((f, i) => `import f${i} from './${f}';`).join('\n')}
        const fixtures = [${files.map((f, i) => `[${JSON.stringify(f)}, f${i}]`).join(', ')}];
        export default () => {
          const results = [];
          for (const [file, fixture] of fixtures) {
            for (const t of fixture.tests) {
              const mode = t.mode || fixture.mode;
              for (const y of [].concat(t.eq || [], t.ne || [])) {
                const name = file + ' [' + mode + '] ' + t.target + ' vs ' + y + ' ' + JSON.stringify(t.opts || {});
                try {
                  results.push([name, latexEqual(t.target, y, { mode, ...t.opts })]);
                } catch (e) {
                  results.push([name, 'threw ' + e]);
                }
              }
            }
          }
          return results;
        };
      `;
    },
  },
];

const run = async (probe: Probe, target: string): Promise<[string, unknown][]> => {
  const { outputFiles } = await esbuild.build({
    stdin: { contents: probe.entry(), resolveDir: probe.resolveDir, loader: 'ts' },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'probe',
    platform: 'browser',
    target,
    // es2015 has no BigInt literals; esbuild warns and writes them as `BigInt(…)` calls.
    logLevel: 'silent',
  });
  // A worker per bundle: each runs in a fresh realm, and the reference and the compiled bundle run
  // side by side. `node:vm` contexts run this code about half as fast.
  const worker = new Worker(
    `${outputFiles[0].text}\nrequire('node:worker_threads').parentPort.postMessage(probe.default());`,
    { eval: true }
  );
  try {
    return await new Promise((resolve, reject) => {
      worker.once('message', resolve);
      worker.once('error', reject);
      worker.once('exit', (code) => reject(new Error(`the ${target} bundle exited with ${code}`)));
    });
  } finally {
    await worker.terminate();
  }
};

describe(`shared scoring code compiled to the bundle target (${BUNDLE_TARGET})`, () => {
  for (const probe of probes) {
    it(`${probe.name} decide as they do uncompiled`, { timeout: 120_000 }, async () => {
      const [reference, lowered] = await Promise.all([
        run(probe, 'esnext'),
        run(probe, BUNDLE_TARGET),
      ]);
      expect(reference.length).toBeGreaterThan(0);
      expect(lowered.map(([name]) => name)).toEqual(reference.map(([name]) => name));
      const changed = lowered.flatMap(([name, result], i) =>
        result === reference[i][1]
          ? []
          : [
              `${name}: ${JSON.stringify(reference[i][1])} uncompiled, ${JSON.stringify(result)} compiled`,
            ]
      );
      expect(changed).toEqual([]);
    });
  }
});
