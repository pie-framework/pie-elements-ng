import { createHash } from 'node:crypto';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, type Rolldown } from 'vite';
import { describe, expect, it } from 'vitest';
import { browserCssLoaderPlugin } from '../tools/vite/browser-css-loader.ts';

type Output = (Rolldown.OutputChunk | Rolldown.OutputAsset)[];

async function writeFixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'pie-browser-css-loader-'));
  for (const [name, source] of Object.entries(files)) {
    await writeFile(join(root, name), source, 'utf8');
  }
  return root;
}

async function buildLibrary(
  root: string,
  entries: string[],
  { withLoader = true } = {}
): Promise<Output> {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: withLoader ? [browserCssLoaderPlugin()] : [],
    build: {
      cssCodeSplit: true,
      write: false,
      minify: false,
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(
          entries.map((name) => [name.replace(/\.js$/, ''), join(root, name)])
        ),
        formats: ['es'],
      },
    },
  });
  return (Array.isArray(result) ? result[0] : (result as Rolldown.RolldownOutput)).output;
}

const chunks = (output: Output) =>
  output.filter((item): item is Rolldown.OutputChunk => item.type === 'chunk');
const cssAssets = (output: Output) =>
  output.filter(
    (item): item is Rolldown.OutputAsset => item.type === 'asset' && item.fileName.endsWith('.css')
  );
const LOADER_PATTERN = /^await \(\(stylesheets\) => \{[\s\S]*?\n\}\)\((\[.*\])\);\n/;
const loaderTargets = (code: string): [string, string][] => {
  const match = LOADER_PATTERN.exec(code);
  return match ? JSON.parse(match[1]) : [];
};
const contentHash = (source: string | Uint8Array) =>
  createHash('sha256').update(source).digest('hex').slice(0, 16);

describe('browser CSS loader plugin', () => {
  it('makes the chunk that imports CSS load it, and leaves other chunks alone', async () => {
    const output = await buildLibrary(
      await writeFixture({
        'shared.js': "import './style.css';\nexport const shared = 'shared';\n",
        'style.css': '.mq-math-mode { display: inline-block; }\n',
        'a.js': "import { shared } from './shared.js';\nexport default shared + 'a';\n",
        'b.js': "import { shared } from './shared.js';\nexport default shared + 'b';\n",
      }),
      ['a.js', 'b.js']
    );

    const [css] = cssAssets(output);
    const loading = chunks(output).filter((chunk) => loaderTargets(chunk.code).length > 0);

    expect(cssAssets(output)).toHaveLength(1);
    expect(loading).toHaveLength(1);
    expect(loading[0].isEntry).toBe(false);
    expect(loaderTargets(loading[0].code)).toEqual([
      [contentHash(css.source), `./${css.fileName}`],
    ]);
  });

  it('loads CSS that Vite folded out of a pure-CSS chunk from every importer', async () => {
    // A stylesheet imported directly by two entries becomes its own CSS-only chunk, which
    // vite:css-post deletes in generateBundle and credits to the importers instead.
    const output = await buildLibrary(
      await writeFixture({
        'only.css': '.shared-only { color: red; }\n',
        'c.js': "import './only.css';\nexport default 'c';\n",
        'd.js': "import './only.css';\nexport default 'd';\n",
      }),
      ['c.js', 'd.js']
    );

    const [css] = cssAssets(output);
    const entries = chunks(output).filter((chunk) => chunk.isEntry);

    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(loaderTargets(entry.code)).toEqual([[contentHash(css.source), `./${css.fileName}`]]);
    }
  });

  it('prepends whole lines and moves the sourcemap down by the same count', async () => {
    const root = await writeFixture({
      'shared.js': "import './style.css';\nexport const shared = 'shared';\n",
      'style.css': '.x { color: red; }\n',
      'a.js': "import { shared } from './shared.js';\nexport default shared;\n",
    });
    const withLoader = await buildLibrary(root, ['a.js']);
    const without = await buildLibrary(root, ['a.js'], { withLoader: false });
    const [chunk] = chunks(withLoader).filter((item) => loaderTargets(item.code).length > 0);
    const original = chunks(without).find((item) => item.fileName === chunk.fileName);
    const mappings = (output: Output, fileName: string) =>
      (
        JSON.parse(
          String((output.find((item) => item.fileName === fileName) as Rolldown.OutputAsset).source)
        ) as {
          mappings: string;
        }
      ).mappings;

    const [loader] = LOADER_PATTERN.exec(chunk.code) ?? [''];
    expect(chunk.code).toBe(loader + original?.code);
    expect(mappings(withLoader, `${chunk.fileName}.map`)).toBe(
      ';'.repeat(loader.split('\n').length - 1) + mappings(without, `${chunk.fileName}.map`)
    );
  });
});
