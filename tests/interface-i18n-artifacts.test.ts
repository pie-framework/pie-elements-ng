import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { globSync } from 'glob';
import { describe, expect, test } from 'vitest';

// What the built delivery bundles of an element migrated to @pie-element/shared-i18n must hold:
// English in the static graph and the IIFE, every other shipped locale behind a dynamic import in
// the browser build and absent from the IIFE, and no i18next in either.

const root = process.cwd();

/** Migrated elements and the packages whose catalogs reach their delivery view. */
const migratedElements = [
  {
    dir: 'packages/elements-react/multiple-choice',
    catalogPackages: [
      'packages/elements-react/multiple-choice',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
];

const catalogPackages = globSync('packages/*/*/src/i18n/catalog-manifest.json', { cwd: root })
  .map((manifest) => dirname(dirname(dirname(manifest))))
  .sort();

type Node = string | { [key: string]: Node };

function leaves(node: Node): string[] {
  return typeof node === 'string' ? [node] : Object.values(node).flatMap(leaves);
}

/** Values distinct enough that finding one in a bundle means the catalog is there. */
async function catalogValues(packageDir: string, locale: string): Promise<string[]> {
  const module = await import(join(root, packageDir, `src/i18n/${locale}.ts`));
  return leaves(module.default).filter((value) => value.length >= 8);
}

/** A browser entry and every module it imports statically, transitively. */
function staticGraph(entry: string): string[] {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf-8');
    for (const [, specifier] of source.matchAll(
      /(?:^|[;\n])\s*(?:import|export)\s*(?:[^'"();]*?\sfrom\s*)?["'](\.{1,2}\/[^"']+)["']/g
    )) {
      visit(join(dirname(file), specifier));
    }
  };
  visit(entry);
  return [...seen];
}

const read = (files: string[]) => files.map((file) => readFileSync(file, 'utf-8')).join('\n');

describe('migrated catalog packages', () => {
  test('the gate discovers at least the Phase 1 packages', () => {
    expect(catalogPackages).toEqual(
      expect.arrayContaining(migratedElements.flatMap(({ catalogPackages }) => catalogPackages))
    );
  });

  test.each(catalogPackages)('%s keeps every loader eager for webpack builds', (packageDir) => {
    const built = readFileSync(join(root, packageDir, 'dist/i18n/index.js'), 'utf-8');
    const loaders = built.match(/import\(/g) ?? [];
    const eager = built.match(/import\(\s*\/\*\s*webpackMode:\s*"eager"\s*\*\//g) ?? [];
    expect(loaders.length).toBeGreaterThan(0);
    expect(eager).toHaveLength(loaders.length);
  });
});

describe.each(migratedElements)('$dir delivery bundles', ({ dir, catalogPackages }) => {
  const dist = join(root, dir, 'dist');
  const views = ['delivery', 'print'].filter((view) =>
    existsSync(join(dist, 'browser', view, 'index.js'))
  );
  const graph = [
    ...new Set(views.flatMap((view) => staticGraph(join(dist, 'browser', view, 'index.js')))),
  ];
  const staticSource = read(graph);
  const lazySource = read(
    globSync('browser/*.js', { cwd: dist, absolute: true }).filter((file) => !graph.includes(file))
  );
  const iife = readFileSync(join(dist, 'index.iife.js'), 'utf-8');

  test('carry no i18next', () => {
    expect(views).toContain('delivery');
    expect(staticSource).not.toMatch(/i18next/);
    expect(iife).not.toMatch(/i18next/);
  });

  test.each(catalogPackages)('render %s English with no load', async (packageDir) => {
    for (const value of await catalogValues(packageDir, 'en-US')) {
      expect(staticSource, value).toContain(value);
      expect(iife, value).toContain(value);
    }
  });

  test.each(catalogPackages)(
    'split %s Spanish out of the browser graph and leave it out of the IIFE',
    async (packageDir) => {
      for (const value of await catalogValues(packageDir, 'es')) {
        expect(staticSource, `${value} in ${graph.map((f) => relative(dist, f))}`).not.toContain(
          value
        );
        expect(lazySource, value).toContain(value);
        expect(iife, value).not.toContain(value);
      }
    }
  );
});
