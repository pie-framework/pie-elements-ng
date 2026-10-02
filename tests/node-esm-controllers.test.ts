import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { globSync } from 'glob';

type PackageJson = {
  name: string;
  private?: boolean;
  exports?: Record<string, string | { default?: string }>;
};

type ImportResult = { exports?: string[]; error?: string };

const CONTROLLER_EXPORTS = ['./controller', './browser/controller'] as const;
const RESULT_MARKER = '@@node-esm-controllers@@';

// Hosts score sessions by importing element controllers in plain Node. Node's ESM loader rejects
// a named import that a CommonJS dependency does not statically expose, which bundlers and
// Vitest's module runner both tolerate, so the imports run in a separate Node process.
const IMPORT_SCRIPT = `
const results = {};
for (const { id, url } of JSON.parse(process.env.PIE_CONTROLLER_ENTRIES)) {
  try {
    results[id] = { exports: Object.keys(await import(url)).sort() };
  } catch (error) {
    results[id] = { error: String(error?.message ?? error).split('\\n')[0] };
  }
}
console.log('${RESULT_MARKER}' + JSON.stringify(results));
`;

function controllerEntries(root: string) {
  const entries: { id: string; url: string }[] = [];
  const packageJsonPaths = globSync('packages/elements-{react,svelte}/*/package.json', {
    cwd: root,
    absolute: true,
  }).sort();

  for (const packageJsonPath of packageJsonPaths) {
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
    if (pkg.private) {
      continue;
    }
    for (const key of CONTROLLER_EXPORTS) {
      const value = pkg.exports?.[key];
      const target = typeof value === 'string' ? value : value?.default;
      if (target) {
        entries.push({
          id: `${pkg.name}${key.slice(1)}`,
          url: pathToFileURL(join(dirname(packageJsonPath), target)).href,
        });
      }
    }
  }
  return entries;
}

describe('element controllers in Node ESM', () => {
  test('every published controller entry imports in plain Node', () => {
    const entries = controllerEntries(process.cwd());
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', IMPORT_SCRIPT], {
      encoding: 'utf-8',
      env: { ...process.env, PIE_CONTROLLER_ENTRIES: JSON.stringify(entries) },
      maxBuffer: 16 * 1024 * 1024,
    });
    const line = child.stdout.split('\n').find((output) => output.startsWith(RESULT_MARKER)) ?? '';
    expect(line, child.stderr).not.toBe('');
    const results = JSON.parse(line.slice(RESULT_MARKER.length)) as Record<string, ImportResult>;

    const failures = Object.entries(results)
      .filter(([, result]) => result.error)
      .map(([id, result]) => `${id}: ${result.error}`);
    expect(failures).toEqual([]);
    expect(Object.keys(results)).toHaveLength(entries.length);

    // image-cloze-association named-imported `camelizeKeys` from CommonJS `humps`.
    for (const id of [
      '@pie-element/image-cloze-association/controller',
      '@pie-element/image-cloze-association/browser/controller',
    ]) {
      expect(results[id]?.exports).toEqual(expect.arrayContaining(['model', 'outcome']));
    }
  }, 60_000);
});
