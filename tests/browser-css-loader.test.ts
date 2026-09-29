import { createHash, randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, type Rolldown } from 'vite';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { hasTopLevelAwait } from '../scripts/check-publish-surface.mjs';
import { browserCssLoaderPlugin } from '../tools/vite/browser-css-loader.ts';

type Output = (Rolldown.OutputChunk | Rolldown.OutputAsset)[];

// Under node_modules so that Vitest hands the built chunks to Node's own loader: its module
// runner cannot import files created after it started. A module package, so library mode names
// chunks .js and Node loads them as ES modules.
const FIXTURES = join(process.cwd(), 'node_modules', '.cache', 'pie-browser-css-loader');

async function writeFixture(files: Record<string, string | Uint8Array>): Promise<string> {
  await mkdir(FIXTURES, { recursive: true });
  const root = await mkdtemp(join(FIXTURES, 'fixture-'));
  for (const [name, source] of Object.entries({ 'package.json': '{"type":"module"}', ...files })) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), source);
  }
  return root;
}

async function buildLibrary(
  root: string,
  entries: Record<string, string>,
  { withLoader = true, outDir = '' } = {}
): Promise<Output> {
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: withLoader ? [browserCssLoaderPlugin()] : [],
    build: {
      cssCodeSplit: true,
      write: outDir !== '',
      outDir: outDir || 'dist',
      emptyOutDir: true,
      minify: false,
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(
          Object.entries(entries).map(([name, file]) => [name, join(root, file)])
        ),
        formats: ['es'],
      },
    },
  });
  return (Array.isArray(result) ? result[0] : (result as Rolldown.RolldownOutput)).output;
}

const chunks = (output: Output) =>
  output.filter((item): item is Rolldown.OutputChunk => item.type === 'chunk');
const assets = (output: Output) =>
  output.filter(
    (item): item is Rolldown.OutputAsset => item.type === 'asset' && !item.fileName.endsWith('.map')
  );
const installs = (chunk: Rolldown.OutputChunk) => chunk.code.startsWith('((stylesheets) => {');
const contentHash = (source: string | Uint8Array) =>
  createHash('sha256').update(source).digest('hex').slice(0, 16);

async function evaluate(outDir: string, fileName: string): Promise<void> {
  await import(/* @vite-ignore */ pathToFileURL(join(outDir, fileName)).href);
}

const installedStyles = () =>
  [...document.querySelectorAll<HTMLStyleElement>('style[data-pie-css]')].map((style) => ({
    hash: style.dataset.pieCss,
    parent: style.parentNode === document.head ? 'head' : 'elsewhere',
    css: style.textContent,
  }));

afterEach(() => {
  for (const style of document.querySelectorAll('style[data-pie-css]')) style.remove();
});

afterAll(async () => {
  await rm(FIXTURES, { recursive: true, force: true });
});

describe('browser CSS loader plugin', () => {
  it('installs the stylesheet from the chunk that imports it, without top-level await or a CSS file', async () => {
    const files = {
      'shared.js': "import './style.css';\nexport const shared = 'shared';\n",
      'style.css': '.mq-math-mode { display: inline-block; }\n',
      'a.js': "import { shared } from './shared.js';\nexport default shared + 'a';\n",
      'b.js': "import { shared } from './shared.js';\nexport default shared + 'b';\n",
    };
    const root = await writeFixture(files);
    const outDir = join(root, 'out');
    const output = await buildLibrary(root, { a: 'a.js', b: 'b.js' }, { outDir });
    const extracted = assets(await buildLibrary(root, { a: 'a.js' }, { withLoader: false }));
    const css = String(extracted.find((asset) => asset.fileName.endsWith('.css'))?.source);

    expect(assets(output)).toEqual([]);
    expect(
      chunks(output)
        .filter(installs)
        .map((chunk) => chunk.isEntry)
    ).toEqual([false]);
    for (const chunk of chunks(output)) {
      expect(hasTopLevelAwait(chunk.code), chunk.fileName).toBe(false);
    }

    await evaluate(outDir, 'a.js');
    await evaluate(outDir, 'b.js');
    expect(installedStyles()).toEqual([{ hash: contentHash(css), parent: 'head', css }]);
  });

  it('installs CSS that Vite folded out of a pure-CSS chunk from every importer, once per page', async () => {
    // A stylesheet imported directly by two entries becomes its own CSS-only chunk, which
    // vite:css-post deletes in generateBundle and credits to the importers instead.
    const root = await writeFixture({
      'only.css': '.shared-only { color: red; }\n',
      'c.js': "import './only.css';\nexport default 'c';\n",
      'd.js': "import './only.css';\nexport default 'd';\n",
    });
    const outDir = join(root, 'out');
    const output = await buildLibrary(root, { c: 'c.js', d: 'd.js' }, { outDir });

    const entries = chunks(output).filter((chunk) => chunk.isEntry);
    expect(entries).toHaveLength(2);
    expect(entries.every(installs)).toBe(true);

    await evaluate(outDir, 'c.js');
    await evaluate(outDir, 'd.js');
    expect(installedStyles().map((style) => style.css)).toEqual([
      expect.stringContaining('.shared-only'),
    ]);
  });

  it('ships a font as a file named by a literal new URL, keeping only its WOFF2 source', async () => {
    const woff2 = randomBytes(6000);
    const root = await writeFixture({
      'style.css': [
        '@font-face {',
        '  font-family: Symbola;',
        '  src: url(fonts/Symbola.eot);',
        '  src: local("Symbola Regular"), url(fonts/Symbola.woff2) format("woff2"),',
        '    url(fonts/Symbola.woff) format("woff"), url(fonts/Symbola.ttf) format("truetype");',
        '}',
        '.mq-math-mode { font-family: Symbola; }',
        '',
      ].join('\n'),
      'fonts/Symbola.eot': randomBytes(6000),
      'fonts/Symbola.woff2': woff2,
      'fonts/Symbola.woff': randomBytes(6000),
      'fonts/Symbola.ttf': randomBytes(6000),
      'delivery.js': "import './style.css';\nexport default 'delivery';\n",
    });
    const outDir = join(root, 'out');
    const output = await buildLibrary(root, { 'delivery/index': 'delivery.js' }, { outDir });

    const [font, ...others] = assets(output);
    expect(others).toEqual([]);
    expect(font.fileName).toMatch(/^assets\/Symbola-[0-9a-f]{8}\.woff2$/);
    expect(Buffer.from(await readFile(join(outDir, font.fileName)))).toEqual(woff2);

    const [chunk] = chunks(output);
    expect(chunk.fileName).toBe('delivery/index.js');
    expect(chunk.code).not.toContain('data:');
    expect(
      [...chunk.code.matchAll(/new URL\(([^,]*), import\.meta\.url\)/g)].map((m) => m[1])
    ).toEqual([`"../${font.fileName}"`]);

    await evaluate(outDir, chunk.fileName);
    const fontUrl = pathToFileURL(join(outDir, font.fileName)).href;
    const [style, ...extra] = installedStyles();
    expect(extra).toEqual([]);
    expect(style.css).toContain(`src: local("Symbola Regular"),url("${fontUrl}") format("woff2");`);
    expect(style.css).not.toMatch(/\.eot|"woff"|truetype/);
  });

  it('keeps data URIs within the inline limit inline', async () => {
    const root = await writeFixture({
      'style.css': '.icon { background: url(icon.png); }\n',
      'icon.png': randomBytes(200),
      'entry.js': "import './style.css';\nexport default 'entry';\n",
    });
    const output = await buildLibrary(root, { entry: 'entry.js' });

    expect(assets(output)).toEqual([]);
    expect(chunks(output)[0].code).toContain('url(data:image/png;base64,');
  });

  it('prepends whole lines and moves the sourcemap down by the same count', async () => {
    const root = await writeFixture({
      'shared.js': "import './style.css';\nexport const shared = 'shared';\n",
      'style.css': '.x { color: red; }\n',
      'a.js': "import { shared } from './shared.js';\nexport default shared;\n",
    });
    const withLoader = await buildLibrary(root, { a: 'a.js' });
    const without = await buildLibrary(root, { a: 'a.js' }, { withLoader: false });
    const [chunk] = chunks(withLoader).filter(installs);
    const original = chunks(without).find((item) => item.fileName === chunk.fileName);
    const mappings = (output: Output, fileName: string) =>
      (
        JSON.parse(
          String((output.find((item) => item.fileName === fileName) as Rolldown.OutputAsset).source)
        ) as { mappings: string }
      ).mappings;

    const installer = chunk.code.slice(0, chunk.code.length - (original?.code.length ?? 0));
    expect(installer.endsWith('\n')).toBe(true);
    expect(chunk.code).toBe(installer + original?.code);
    expect(mappings(withLoader, `${chunk.fileName}.map`)).toBe(
      ';'.repeat(installer.split('\n').length - 1) + mappings(without, `${chunk.fileName}.map`)
    );
  });
});
