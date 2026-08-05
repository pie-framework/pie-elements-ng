import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadPointerValue } from '../src/lib/docs/source-extractor.js';
import { generateDocsForContract } from '../src/lib/docs/generator.js';
import { parseContract, seedContractForElement } from '../src/lib/docs/contracts.js';
import { validateContracts } from '../src/lib/docs/contract-validator.js';
import { inferViewsFromPackageExports } from '../src/lib/docs/discovery.js';

describe('docs source extractor', () => {
  it('evaluates object defaults with const spreads and templates', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-docs-test-'));
    const pkgDir = join(root, 'packages', 'elements-svelte', 'demo');
    await mkdir(join(pkgDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(pkgDir, 'src', 'controller', 'defaults.ts'),
      `
      export const TOKEN = '{{blank}}';
      export const LIMITS = { width: 7, height: 4 } as const;
      export default {
        model: {
          template: \`Answer \${TOKEN}\`,
          limits: { ...LIMITS }
        },
        configuration: {
          prompt: { settings: true }
        }
      };
      `,
      'utf-8'
    );

    const value = await loadPointerValue(pkgDir, {
      file: 'src/controller/defaults.ts',
      path: 'model.limits',
    });

    expect(value).toEqual({ width: 7, height: 4 });
  });
});

describe('docs contracts and generation', () => {
  it('infers only user-facing docs views from package exports', () => {
    expect(
      inferViewsFromPackageExports({
        '.': './dist/index.js',
        './delivery': './dist/delivery/index.js',
        './author': './dist/author/index.js',
        './print': './dist/print/index.js',
        './browser/delivery': './dist/browser/delivery/index.js',
        './browser/author': './dist/browser/author/index.js',
        './browser/controller': './dist/browser/controller/index.js',
        './configure': './dist/author/index.js',
        './controller': './dist/controller/index.js',
        './controller.js': './dist/controller/index.js',
        './runtime-support': './dist/runtime-support/index.js',
      })
    ).toEqual(['author', 'delivery', 'print']);
  });

  it('seeds contract and generates html docs with defaults', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-docs-test-'));
    const pkgDir = join(root, 'packages', 'elements-svelte', 'simple-cloze');
    await mkdir(join(pkgDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(pkgDir, 'package.json'),
      JSON.stringify(
        {
          name: '@pie-element/simple-cloze',
          description: 'Simple cloze test element',
          exports: {
            '.': './dist/index.js',
            './delivery': './dist/delivery/index.js',
            './author': './dist/author/index.js',
          },
        },
        null,
        2
      ),
      'utf-8'
    );
    await writeFile(
      join(pkgDir, 'src', 'controller', 'defaults.ts'),
      `
      export default {
        model: { prompt: '<p>Hello</p>', enabled: true, maxChoices: 4 },
        configuration: { prompt: { settings: true, label: 'Prompt' } }
      };
      `,
      'utf-8'
    );

    const seeded = await seedContractForElement(
      {
        elementName: 'simple-cloze',
        packageName: '@pie-element/simple-cloze',
        framework: 'svelte',
        packageDir: pkgDir,
        packageDescription: 'Simple cloze test element',
        exportsMap: {
          '.': './dist/index.js',
          './delivery': './dist/delivery/index.js',
          './author': './dist/author/index.js',
        },
      },
      root
    );
    expect(seeded.wrote).toBe(true);

    const contract = parseContract(
      JSON.parse(await readFile(join(pkgDir, 'docs.contract.json'), 'utf-8')),
      'contract'
    );
    const validation = validateContracts([{ packageDir: pkgDir, contract }]);
    expect(validation.issues).toHaveLength(0);

    const result = await generateDocsForContract(pkgDir, contract, {
      outputDir: join(root, 'docs', 'element-docs'),
      dryRun: false,
      check: false,
    });

    expect(result.filesWritten.length).toBeGreaterThan(0);
    const generatedPath = join(root, 'docs', 'element-docs', 'simple-cloze', 'delivery.html');
    const generated = await readFile(generatedPath, 'utf-8');
    expect(generated).toContain('<h2>Model Defaults</h2>');
    expect(generated).toContain('<h2>Authoring/Configuration Defaults</h2>');
    expect(generated).toContain('<h3><code>model.prompt</code></h3>');
    expect(generated).toContain('<strong>Default:</strong>');

    const indexPath = join(root, 'docs', 'element-docs', 'simple-cloze', 'index.html');
    const index = await readFile(indexPath, 'utf-8');
    expect(index).toContain('<a href="./delivery.html">delivery</a>');

    const manifestPath = join(root, 'docs', 'element-docs', 'simple-cloze', 'manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8')) as {
      views: Array<{ id: string; file: string }>;
    };
    expect(manifest.views.some((v) => v.id === 'delivery' && v.file === 'delivery.html')).toBe(
      true
    );
  });

  it('reports drift when docs content differs in check mode', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-docs-test-'));
    const pkgDir = join(root, 'packages', 'elements-svelte', 'simple-cloze');
    await mkdir(join(pkgDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(pkgDir, 'src', 'controller', 'defaults.ts'),
      `export default { model: { prompt: 'A' }, configuration: { prompt: { settings: true } } };`,
      'utf-8'
    );
    const contract = parseContract(
      {
        elementName: 'simple-cloze',
        packageName: '@pie-element/simple-cloze',
        framework: 'svelte',
        views: [
          {
            view: 'delivery',
            pie: { file: 'src/controller/defaults.ts', path: 'model' },
            config: { file: 'src/controller/defaults.ts', path: 'configuration' },
          },
        ],
      },
      'inline'
    );

    const outputDir = join(root, 'docs', 'element-docs');
    await generateDocsForContract(pkgDir, contract, { outputDir, dryRun: false, check: false });
    await writeFile(
      join(outputDir, 'simple-cloze', 'delivery.html'),
      '<h1>stale content</h1>\n',
      'utf-8'
    );
    const check = await generateDocsForContract(pkgDir, contract, {
      outputDir,
      dryRun: false,
      check: true,
    });
    expect(check.driftFiles.length).toBeGreaterThan(0);
  });

  it('applies optional contract metadata for richer docs', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-docs-test-'));
    const pkgDir = join(root, 'packages', 'elements-svelte', 'simple-cloze');
    await mkdir(join(pkgDir, 'src', 'controller'), { recursive: true });
    await writeFile(
      join(pkgDir, 'src', 'controller', 'defaults.ts'),
      `export default { model: { prompt: 'A', choiceMode: 'radio' }, configuration: { prompt: { settings: true } } };`,
      'utf-8'
    );

    const contract = parseContract(
      {
        elementName: 'simple-cloze',
        packageName: '@pie-element/simple-cloze',
        framework: 'svelte',
        views: [
          {
            view: 'delivery',
            pie: { file: 'src/controller/defaults.ts', path: 'model' },
            config: { file: 'src/controller/defaults.ts', path: 'configuration' },
            metadata: {
              pie: {
                'model.choiceMode': {
                  description: 'Selection mode used by delivery rendering.',
                  enum: ['radio', 'checkbox'],
                  required: true,
                },
              },
            },
          },
        ],
      },
      'inline'
    );

    const outputDir = join(root, 'docs', 'element-docs');
    await generateDocsForContract(pkgDir, contract, {
      outputDir,
      dryRun: false,
      check: false,
    });
    const generated = await readFile(join(outputDir, 'simple-cloze', 'delivery.html'), 'utf-8');
    expect(generated).toContain('Selection mode used by delivery rendering.');
    expect(generated).toContain(
      '<strong>Allowed values:</strong> <code>radio</code>, <code>checkbox</code>'
    );
    expect(generated).toContain('<strong>Required:</strong> <code>true</code>');
  });
});
