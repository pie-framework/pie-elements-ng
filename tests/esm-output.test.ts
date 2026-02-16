import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { globSync } from 'glob';

type PackageJson = {
  name?: string;
  private?: boolean;
  type?: string;
  main?: string;
  module?: string;
  exports?: Record<string, string | { default?: string; import?: string }>;
  files?: string[];
};

function collectExportTargets(exportsField: PackageJson['exports']): string[] {
  if (!exportsField) {
    return [];
  }
  const targets: string[] = [];
  for (const value of Object.values(exportsField)) {
    if (typeof value === 'string') {
      targets.push(value);
      continue;
    }
    if (value?.default) {
      targets.push(value.default);
    } else if (value?.import) {
      targets.push(value.import);
    }
  }
  return targets;
}

function isLikelyEsm(source: string): boolean {
  if (
    source.includes('module.exports') ||
    source.includes('exports.') ||
    source.includes('require(')
  ) {
    return false;
  }
  return /\bexport\b|\bimport\b|import\.meta/.test(source);
}

describe('ESM build outputs', () => {
  const root = process.cwd();
  const packageJsonPaths = globSync('packages/**/package.json', {
    cwd: root,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/esm/**'],
  });

  test('workspace packages expose ESM outputs after build', async () => {
    const failures: string[] = [];

    for (const pkgPath of packageJsonPaths) {
      const pkgDir = dirname(pkgPath);
      const pkg: PackageJson = JSON.parse(await readFile(pkgPath, 'utf-8')) as PackageJson;

      if (pkg.private) {
        continue;
      }

      if (pkg.name?.startsWith('@pie-wc/')) {
        continue;
      }

      const exportTargets = collectExportTargets(pkg.exports);
      const mainTargets = [pkg.main, pkg.module].filter(Boolean) as string[];
      const targets = [...exportTargets, ...mainTargets];
      const distTargets = [...new Set(targets.filter((target) => /\/(dist|esm)\//.test(target)))];

      if (distTargets.length === 0) {
        continue;
      }

      if (pkg.type !== 'module') {
        failures.push(`${pkg.name ?? pkgPath}: package.json "type" is not "module"`);
      }

      for (const target of distTargets) {
        // Allow CSS files for packages that need them (e.g., mathquill)
        const isCss = target.endsWith('.css');
        if (!isCss && !target.endsWith('.js') && !target.endsWith('.mjs')) {
          failures.push(`${pkg.name ?? pkgPath}: export target is not .js/.mjs (${target})`);
        }

        const outputPath = resolve(pkgDir, target);
        if (!existsSync(outputPath)) {
          failures.push(`${pkg.name ?? pkgPath}: missing build output ${target}`);
          continue;
        }

        // Skip ESM validation for CSS files
        if (isCss) {
          continue;
        }

        const source = await readFile(outputPath, 'utf-8');
        if (!isLikelyEsm(source)) {
          failures.push(`${pkg.name ?? pkgPath}: ${target} does not look like ESM output`);
        }
      }
    }

    expect(failures).toEqual([]);
  });
});
