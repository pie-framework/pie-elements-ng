/**
 * A page served from `pie.test` with the built adapter, the MathJax 4 it loads and the legacy
 * MathJax 3 renderer, all from local packages. Any other request is refused and recorded.
 *
 * Packages are served in the npm layout under any path ending in `/npm/`, so the adapter finds its
 * asset root from its own URL as it does on a CDN. The adapter is the npm build, which loads the
 * page's MathJax, or the browser ESM build, which bundles its own. Under `/copy-<n>/npm/` the
 * browser build is a separate set of modules, as each element that bundles the adapter has its
 * own. Under `/assets/` it is served as a host's bundle would be, with no asset root to find.
 * `ASSET_ORIGIN` serves the same files from another origin, as a CDN does. Under `/emitted/` each
 * file of the npm layout has a flat name, as a bundler emits the files a module names.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page, type Route } from '@playwright/test';

export const ORIGIN = 'http://pie.test';
/** Another origin serving the npm layout, with CORS headers. */
export const ASSET_ORIGIN = 'http://assets.pie.test';
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(packageDir, 'package.json'));
const mathjaxDir = dirname(require.resolve('mathjax/package.json'));
const fromMathjax = createRequire(join(mathjaxDir, 'package.json'));

const versionOf = (dir: string): string =>
  JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')).version;

const ADAPTER = '@pie-element/shared-math-rendering-mathjax';

/** The page's npm root. */
export const NPM_ROOT = `${ORIGIN}/npm`;

/** The adapter build `openPage` serves, at a path in the npm layout. */
export const ADAPTER_URL = `/npm/${ADAPTER}@${versionOf(packageDir)}/dist/adapter.js`;

/** The browser build as copy `n`, whose npm root is `/copy-<n>/npm`. */
export const copyUrl = (n: number) => `/copy-${n}${ADAPTER_URL}`;

/** The adapter build at a path outside the npm layout. */
export const UNROOTED_ADAPTER_URL = '/assets/adapter.js';

/** MathJax 4's SVG component build, under the page's npm root. */
export const SVG_BUILD_URL = `${NPM_ROOT}/mathjax@4.1.3/tex-svg.js`;

/**
 * The packages MathJax 4.1.3 loads files from, served from the installed copies at their
 * installed version: the component build with its speech worker, its font and mhchem's font
 * extension.
 */
const NPM_PACKAGES: Record<string, string> = {
  mathjax: mathjaxDir,
  '@mathjax/mathjax-newcm-font': dirname(
    fromMathjax.resolve('@mathjax/mathjax-newcm-font/package.json')
  ),
  '@mathjax/mathjax-mhchem-font-extension': dirname(
    require.resolve('@mathjax/mathjax-mhchem-font-extension/package.json')
  ),
};

/** A URL outside the npm layout serving the file at npm path `path`, as a bundler emits it. */
export const emittedUrl = (path: string) => `${ORIGIN}/emitted/${encodeURIComponent(path)}`;

/**
 * `assetUrls` giving every file the browser build loads, with English speech, its emitted URL: the
 * fonts, the speech worker and its mathmaps.
 */
export function emittedAssetUrls(): Record<string, string> {
  const fontFiles = (name: string) =>
    readdirSync(join(NPM_PACKAGES[name], 'chtml', 'woff2')).map(
      (file) => `${name}@${versionOf(NPM_PACKAGES[name])}/chtml/woff2/${file}`
    );
  const sre = `mathjax@${versionOf(mathjaxDir)}/sre`;
  const paths = [
    ...fontFiles('@mathjax/mathjax-newcm-font'),
    ...fontFiles('@mathjax/mathjax-mhchem-font-extension'),
    `${sre}/speech-worker.js`,
    ...['base', 'en', 'nemeth', 'euro'].map((map) => `${sre}/mathmaps/${map}.json`),
  ];
  return Object.fromEntries(paths.map((path) => [path, emittedUrl(path)]));
}

/** Which build of the adapter `ADAPTER_URL` serves. */
export type Build = 'npm' | 'browser';

const BROWSER_DIST = join(packageDir, 'dist', 'browser');

/** The chunks of the browser build, which the adapter imports beside itself. */
export function browserChunks(): string[] {
  return readdirSync(BROWSER_DIST)
    .filter((file) => file.endsWith('.js') && file !== 'index.js')
    .sort();
}

/**
 * The legacy renderer's own MathJax 3 fonts and speech rules. They are refused: whether they load
 * does not change what the MathJax 3 renderer does to the rest of the page.
 */
const LEGACY_ASSETS = [
  'https://unpkg.com/mathjax-full@3.2.2/',
  'https://cdn.jsdelivr.net/npm/speech-rule-engine@',
];

const CONTENT_TYPES: Record<string, string> = {
  js: 'application/javascript',
  json: 'application/json',
  woff2: 'font/woff2',
  woff: 'font/woff',
};

const NPM_PATH = /^(?:\/[\w.-]+)*?\/npm\/((?:@[^/]+\/)?[^@/]+)@([^/]+)\/(.+)$/;

/** The adapter build, or one of its chunks, named `file`. */
function adapterFile(file: string, build: Build): string | undefined {
  if (file === 'adapter.js') {
    return build === 'npm' ? join(packageDir, 'dist', 'index.js') : join(BROWSER_DIST, 'index.js');
  }
  return build === 'browser' && /^[\w.-]+\.js$/.test(file) ? join(BROWSER_DIST, file) : undefined;
}

/** The file a path in the npm layout names, for `build`. */
function npmFile(pathname: string, build: Build): string | undefined {
  const match = pathname.match(NPM_PATH);
  if (!match) return undefined;
  const [, name, version, file] = match;
  if (name === ADAPTER) {
    if (version !== versionOf(packageDir) || !file.startsWith('dist/')) return undefined;
    return adapterFile(file.slice('dist/'.length), build);
  }
  const dir = NPM_PACKAGES[name];
  return dir && version === versionOf(dir) ? join(dir, file) : undefined;
}

/**
 * Opens a page holding `body`, serving the built adapter, MathJax 4 and the legacy renderer, under
 * the content security policy `csp` when given.
 */
export async function openPage(
  page: Page,
  body: string,
  build: Build = 'npm',
  { csp }: { csp?: string } = {}
) {
  const unserved: string[] = [];
  /** The files served from the npm layout, the adapter's own included. */
  const served: string[] = [];
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));

  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (!LEGACY_ASSETS.some((prefix) => url.startsWith(prefix))) unserved.push(url);
    return route.abort();
  });
  const serve = (route: Route) => {
    const url = route.request().url();
    const { origin, pathname } = new URL(url);
    if (origin === ASSET_ORIGIN && !NPM_PATH.test(pathname)) {
      unserved.push(url);
      return route.fulfill({ status: 404 });
    }
    if (pathname === '/') {
      const html = `<!doctype html><html><head><meta charset="utf-8"></head>${body}</html>`;
      return route.fulfill({
        contentType: 'text/html',
        headers: csp ? { 'Content-Security-Policy': csp } : {},
        body: html,
      });
    }
    if (pathname === '/legacy-renderer.js') {
      return route.fulfill({
        contentType: 'application/javascript',
        body: readFileSync(require.resolve('@pie-lib/math-rendering-module/module/index.js')),
      });
    }
    const unrooted = pathname.match(/^\/assets\/([\w.-]+\.js)$/)?.[1];
    const emitted = pathname.match(/^\/emitted\/([^/]+)$/)?.[1];
    if (!unrooted && !emitted && !NPM_PATH.test(pathname)) return route.fulfill({ status: 404 });
    const file = unrooted
      ? adapterFile(unrooted, build)
      : npmFile(emitted ? `/npm/${decodeURIComponent(emitted)}` : pathname, build);
    if (!file || !existsSync(file)) {
      unserved.push(url);
      return route.fulfill({ status: 404 });
    }
    if (!unrooted) served.push(url);
    return route.fulfill({
      contentType: CONTENT_TYPES[file.split('.').pop() ?? ''] ?? 'application/octet-stream',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: readFileSync(file),
    });
  };
  await page.route(`${ORIGIN}/**`, serve);
  await page.route(`${ASSET_ORIGIN}/**`, serve);

  await page.addInitScript(() => {
    const conflicts: string[] = [];
    const noAssetRoot: string[] = [];
    const violations: string[] = [];
    Object.assign(window, { conflicts, noAssetRoot, violations });
    window.addEventListener('pie-mathjax-version-conflict', (event) => {
      conflicts.push((event as CustomEvent<{ condition: string }>).detail.condition);
    });
    window.addEventListener('pie-mathjax-no-asset-root', (event) => {
      noAssetRoot.push((event as CustomEvent<{ effect: string }>).detail.effect);
    });
    document.addEventListener('securitypolicyviolation', (event) => {
      violations.push(`${event.effectiveDirective} ${event.blockedURI}`);
    });
  });
  await page.goto(`${ORIGIN}/`);
  return { unserved, errors, served };
}

export function renderWithAdapter(page: Page, id: string, url = ADAPTER_URL) {
  return page.evaluate(
    async ([target, adapterUrl]) => {
      const adapter = await import(adapterUrl);
      await adapter.createMathjaxRenderer()(document.getElementById(target));
    },
    [id, url]
  );
}

/** The items of each open menu, `[disabled]` marking those that are. */
export function openMenus(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.CtxtMenu_Menu')].map((menu) =>
      [...menu.querySelectorAll(':scope > .CtxtMenu_MenuItem')]
        .map((item) => {
          const label = (item.textContent ?? '').replace(/[✓►]/g, '').trim();
          return item.getAttribute('aria-disabled') === 'true' ? `${label} [disabled]` : label;
        })
        .filter(Boolean)
    )
  );
}

/** Opens the context menu of `selector`'s math and the submenus `path` names, in turn. */
export async function openMenu(page: Page, selector: string, path: string[]) {
  await page.locator(`${selector} mjx-container`).click({ button: 'right' });
  for (const label of path) {
    await page.locator('.CtxtMenu_MenuItem', { hasText: label }).first().hover();
    await expect(page.locator('.CtxtMenu_Menu')).toHaveCount(path.indexOf(label) + 2);
  }
  return openMenus(page);
}
