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
  {
    dir: 'packages/elements-react/passage',
    catalogPackages: ['packages/elements-react/passage', 'packages/lib-react/render-ui'],
  },
  {
    dir: 'packages/elements-react/select-text',
    catalogPackages: [
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/text-select',
    ],
  },
  {
    dir: 'packages/elements-react/match',
    catalogPackages: [
      'packages/elements-react/match',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/drawing-response',
    catalogPackages: ['packages/elements-react/drawing-response', 'packages/lib-react/render-ui'],
  },
  {
    dir: 'packages/elements-react/hotspot',
    catalogPackages: [
      'packages/elements-react/hotspot',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/placement-ordering',
    catalogPackages: [
      'packages/elements-react/placement-ordering',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/categorize',
    catalogPackages: [
      'packages/elements-react/categorize',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/graphing',
    catalogPackages: [
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/graphing',
    ],
    // MathLive, which the IIFE bundles, ships its own Spanish "Undo" tooltip.
    iifeAlso: ['Deshacer'],
  },
  {
    dir: 'packages/elements-react/image-cloze-association',
    catalogPackages: [
      'packages/elements-react/image-cloze-association',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/charting',
    catalogPackages: [
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/charting',
    ],
  },
  {
    dir: 'packages/elements-react/extended-text-entry',
    catalogPackages: [
      'packages/elements-react/extended-text-entry',
      'packages/lib-react/render-ui',
      'packages/lib-react/editable-html-tip-tap',
    ],
    // MathLive, which the IIFE bundles, ships its own Spanish "Undo" tooltip.
    iifeAlso: ['Deshacer'],
  },
  {
    dir: 'packages/elements-react/rubric',
    catalogPackages: ['packages/elements-react/rubric', 'packages/lib-react/render-ui'],
  },
  {
    dir: 'packages/elements-react/explicit-constructed-response',
    catalogPackages: [
      'packages/elements-react/explicit-constructed-response',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/mask-markup',
      'packages/lib-react/editable-html-tip-tap',
    ],
    // MathLive, which the IIFE bundles, ships its own Spanish "Undo" tooltip.
    iifeAlso: ['Deshacer'],
  },
  {
    dir: 'packages/elements-react/inline-dropdown',
    catalogPackages: [
      'packages/elements-react/inline-dropdown',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/mask-markup',
    ],
  },
  {
    dir: 'packages/elements-react/math-inline',
    catalogPackages: [
      'packages/elements-react/math-inline',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/math-input-mathlive',
    ],
  },
  {
    dir: 'packages/elements-react/ebsr',
    catalogPackages: [
      'packages/elements-react/ebsr',
      'packages/elements-react/multiple-choice',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/drag-in-the-blank',
    catalogPackages: [
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/mask-markup',
    ],
  },
  {
    dir: 'packages/elements-svelte/simple-cloze',
    catalogPackages: ['packages/elements-svelte/simple-cloze'],
  },
  {
    dir: 'packages/elements-svelte/mc-populated-blank',
    catalogPackages: ['packages/elements-svelte/mc-populated-blank'],
  },
  {
    dir: 'packages/elements-svelte/venn-classification',
    catalogPackages: ['packages/elements-svelte/venn-classification'],
  },
  {
    dir: 'packages/elements-svelte/video-stimulus',
    catalogPackages: [
      'packages/elements-svelte/video-stimulus',
      'packages/lib-svelte/media-svelte',
    ],
  },
  {
    dir: 'packages/elements-react/match-list',
    catalogPackages: [
      'packages/elements-react/match-list',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/number-line',
    catalogPackages: [
      'packages/elements-react/number-line',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/matrix',
    catalogPackages: ['packages/lib-react/render-ui'],
  },
  {
    dir: 'packages/elements-react/likert',
    catalogPackages: ['packages/lib-react/render-ui'],
  },
  {
    dir: 'packages/elements-react/multi-trait-rubric',
    catalogPackages: ['packages/elements-react/multi-trait-rubric'],
  },
  {
    dir: 'packages/elements-react/fraction-model',
    catalogPackages: [
      'packages/elements-react/fraction-model',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
    ],
  },
  {
    dir: 'packages/elements-react/graphing-solution-set',
    catalogPackages: [
      'packages/elements-react/graphing-solution-set',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/graphing-solution-set',
    ],
  },
  {
    dir: 'packages/elements-react/math-templated',
    catalogPackages: [
      'packages/elements-react/math-templated',
      'packages/lib-react/render-ui',
      'packages/lib-react/correct-answer-toggle',
      'packages/lib-react/mask-markup',
      'packages/lib-react/math-input-mathlive',
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

  // A Svelte element's npm lanes are self-contained bundles that inline every catalog, so no
  // locale loader reaches a webpack build and there is no dist/i18n/index.js to check.
  test.each(catalogPackages.filter((dir) => !dir.startsWith('packages/elements-svelte/')))(
    '%s keeps every loader eager for webpack builds',
    (packageDir) => {
      const built = readFileSync(join(root, packageDir, 'dist/i18n/index.js'), 'utf-8');
      const loaders = built.match(/import\(/g) ?? [];
      const eager = built.match(/import\(\s*\/\*\s*webpackMode:\s*"eager"\s*\*\//g) ?? [];
      expect(loaders.length).toBeGreaterThan(0);
      expect(eager).toHaveLength(loaders.length);
    }
  );
});

describe.each(migratedElements)('$dir delivery bundles', ({ dir, catalogPackages, iifeAlso }) => {
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
        if (!iifeAlso?.includes(value)) expect(iife, value).not.toContain(value);
      }
    }
  );
});
