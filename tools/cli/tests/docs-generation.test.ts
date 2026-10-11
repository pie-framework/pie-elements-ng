import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { loadPointerValue } from '../src/lib/docs/source-extractor.js';
import { generateDocsForContract } from '../src/lib/docs/generator.js';
import { parseContract, seedContractForElement } from '../src/lib/docs/contracts.js';
import { validateContracts } from '../src/lib/docs/contract-validator.js';
import { inferViewsFromPackageExports } from '../src/lib/docs/discovery.js';
import { schemaDocs } from '../src/lib/docs/schema-properties.js';

const TYPES = `
/** One option the learner can pick */
export interface Choice {
  /** Text the learner sees */
  label: string;
  value: string;
}

export interface SimpleClozeModel {
  id: string;
  element: string;
  /** The question prompt */
  prompt?: string;
  /** How learners select: one choice or several */
  choiceMode?: 'radio' | 'checkbox';
  /** @minimum 1 */
  maxChoices?: number;
  choices: Choice[];
  limits?: {
    /** Width in grid units */
    width?: number;
    height?: number;
  };
}

export interface SimpleClozeConfiguration {
  /** Configuration for the prompt */
  prompt?: { settings?: boolean; label?: string };
}

export interface SimpleClozeSession {
  id: string;
  value?: string[];
}
`;

const EXPORTS = {
  '.': './dist/index.js',
  './delivery': './dist/delivery/index.js',
  './author': './dist/author/index.js',
  './schemas/model.schema.json': './dist/schemas/model.schema.json',
  './schemas/configuration.schema.json': './dist/schemas/configuration.schema.json',
  './schemas/session.schema.json': './dist/schemas/session.schema.json',
};

// A package the docs generator can read: a manifest declaring schemas, the types they generate
// from, and controller defaults.
const writeElementPackage = async (pkgDir: string, defaults: string) => {
  await mkdir(join(pkgDir, 'src', 'controller'), { recursive: true });
  await writeFile(
    join(pkgDir, 'package.json'),
    JSON.stringify({
      name: '@pie-element/simple-cloze',
      version: '1.0.0',
      description: 'Simple cloze test element',
      exports: EXPORTS,
    }),
    'utf-8'
  );
  await writeFile(join(pkgDir, 'tsconfig.json'), '{ "compilerOptions": { "strict": true } }');
  await writeFile(join(pkgDir, 'src', 'types.ts'), TYPES, 'utf-8');
  await writeFile(join(pkgDir, 'src', 'controller', 'defaults.ts'), defaults, 'utf-8');
};

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
    await writeElementPackage(
      pkgDir,
      `
      export default {
        model: { prompt: '<p>Hello</p>', maxChoices: 4 },
        configuration: { prompt: { settings: true, label: 'Prompt' } }
      };
      `
    );

    const seeded = await seedContractForElement(
      {
        elementName: 'simple-cloze',
        packageName: '@pie-element/simple-cloze',
        framework: 'svelte',
        packageDir: pkgDir,
        packageDescription: 'Simple cloze test element',
        exportsMap: EXPORTS,
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
    expect(generated).toContain('<h2>Model</h2>');
    expect(generated).toContain('<h2>Configuration</h2>');
    expect(generated).toContain('<h2>Session</h2>');
    expect(generated).toContain('<h3><code>prompt</code></h3>');
    expect(generated).toContain('<strong>Default:</strong> <code>&lt;p&gt;Hello&lt;/p&gt;</code>');

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
    await writeElementPackage(
      pkgDir,
      `export default { model: { prompt: 'A' }, configuration: { prompt: { settings: true } } };`
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

  it('documents properties from the schemas with defaults from the defaults file', async () => {
    const root = await mkdtemp(join(tmpdir(), 'pie-docs-test-'));
    const pkgDir = join(root, 'packages', 'elements-svelte', 'simple-cloze');
    await writeElementPackage(
      pkgDir,
      `export default { model: { choiceMode: 'radio', limits: { width: 7 } }, configuration: {} };`
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
    const generated = await readFile(join(outputDir, 'simple-cloze', 'delivery.html'), 'utf-8');
    expect(generated).toContain('How learners select: one choice or several');
    expect(generated).toContain(
      '<strong>Allowed values:</strong> <code>radio</code>, <code>checkbox</code>'
    );
    expect(generated).toContain('<code>minimum: 1</code>');
    expect(generated).toContain('<h3><code>limits.width</code></h3>');
    expect(generated).toContain('<strong>Default:</strong> <code>7</code>');
    expect(generated).toContain(
      '<strong>Item Type:</strong> <a href="#model-Choice"><code>Choice</code></a>'
    );
    expect(generated).toContain('<section class="doc-definition" id="model-Choice">');
    expect(generated).toContain('<h4><code>label</code></h4>');
  });
});

describe('schemaDocs', () => {
  const schema = {
    type: 'object',
    properties: {
      title: { $ref: '#/definitions/Label', description: 'The heading' },
      mode: { $ref: '#/definitions/Mode' },
      items: { type: 'array', items: { $ref: '#/definitions/Item' } },
    },
    required: ['items'],
    definitions: {
      Label: { type: 'string', description: 'Any label' },
      Mode: { type: 'string', enum: ['a', 'b'] },
      Item: {
        type: 'object',
        description: 'One entry',
        properties: { next: { $ref: '#/definitions/Item' } },
      },
    },
  };

  it('resolves aliases inline and documents each named object type once', () => {
    const docs = schemaDocs(schema, { mode: 'a' });
    expect(docs.properties).toEqual([
      { path: 'items', type: 'array', required: true, itemType: 'Item' },
      { path: 'mode', type: 'string', required: false, enum: ['a', 'b'], defaultValue: 'a' },
      { path: 'title', type: 'string', required: false, description: 'The heading' },
    ]);
    expect(docs.definitions).toEqual([
      {
        name: 'Item',
        description: 'One entry',
        properties: [{ path: 'next', type: 'Item', required: false }],
      },
    ]);
  });
});
