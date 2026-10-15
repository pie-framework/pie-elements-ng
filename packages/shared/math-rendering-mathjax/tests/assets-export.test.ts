import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { writeAssets } from '../build-assets.js';
import { MATHJAX_VERSION, SRE_PATH } from '../src/assets.js';

const PACKAGE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(join(PACKAGE_DIR, 'package.json'), 'utf8'));
const require = createRequire(join(PACKAGE_DIR, 'package.json'));
const installed = (name: string, from = require) =>
  realpathSync(dirname(from.resolve(`${name}/package.json`)));

/** The fonts the browser build loads, as `src/engine/bundled/mathjax.ts` names them. */
const FONTS = ['mathjax-newcm-font', 'mathjax-mhchem-font-extension'];

/** SRE's locales and braille codes, each a `mathmaps/<id>.json` the speech worker can load. */
async function sreLocales(): Promise<string[]> {
  const sre = installed(
    'speech-rule-engine',
    createRequire(join(installed('@mathjax/src'), 'package.json'))
  );
  const { Variables } = await import(join(sre, 'js', 'common', 'variables.js'));
  return [...(Variables.LOCALES as Map<string, string>).keys()];
}

/** Every npm path the browser build can request: each font's web fonts and SRE's files. */
async function requestable(): Promise<string[]> {
  const fonts = FONTS.flatMap((font) => {
    const dir = `@mathjax/${font}@${MATHJAX_VERSION}/chtml/woff2`;
    return readdirSync(join(installed(`@mathjax/${font}`), 'chtml', 'woff2')).map(
      (file) => `${dir}/${file}`
    );
  });
  const maps = ['base', ...(await sreLocales())].map((id) => `${SRE_PATH}/mathmaps/${id}.json`);
  return [...fonts, `${SRE_PATH}/speech-worker.js`, ...maps];
}

describe('./assets', () => {
  let outDir: string;
  let assetUrls: Record<string, string>;

  beforeAll(async () => {
    // Vitest fails to import from the system temp directory; under node_modules it loads as is.
    const cache = join(PACKAGE_DIR, 'node_modules', '.cache');
    mkdirSync(cache, { recursive: true });
    outDir = mkdtempSync(join(cache, 'assets-'));
    writeAssets(PACKAGE_DIR, outDir);
    ({ assetUrls } = await import(pathToFileURL(join(outDir, 'index.js')).href));
  });

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true });
  });

  it('lists every file the browser build can request, and nothing else', async () => {
    expect(Object.keys(assetUrls).sort()).toEqual((await requestable()).sort());
  });

  it('keys each file by the version pie.assetPackages lists', () => {
    const versions: Record<string, string> = manifest.pie.assetPackages;
    const listed = new Set(Object.entries(versions).map(([name, version]) => `${name}@${version}`));
    const keyed = new Set(
      Object.keys(assetUrls).map((path) => path.match(/^(@[^/]+\/)?[^/]+/)?.[0])
    );
    expect(keyed).toEqual(listed);
  });

  it('points each URL at a copy of its file under npm/', () => {
    const fonts = Object.fromEntries(
      FONTS.map((font) => [`@mathjax/${font}`, installed(`@mathjax/${font}`)])
    );
    const dirs: Record<string, string> = { mathjax: installed('mathjax'), ...fonts };
    for (const [path, url] of Object.entries(assetUrls)) {
      expect(url).toBe(pathToFileURL(join(outDir, 'npm', path)).href);
      const [, name, file] = path.match(/^((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.+)$/) ?? [];
      expect(statSync(fileURLToPath(url)).size).toBe(statSync(join(dirs[name], file)).size);
    }
  });

  it("copies mathjax's LICENSE, which the map leaves out", () => {
    const license = join(outDir, 'npm', `mathjax@${MATHJAX_VERSION}`, 'LICENSE');
    expect(readFileSync(license, 'utf8')).toBe(
      readFileSync(join(installed('mathjax'), 'LICENSE'), 'utf8')
    );
  });
});
