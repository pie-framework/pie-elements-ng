/**
 * A page served from `pie.test` with the built adapter, the MathJax 4 it loads and the legacy
 * MathJax 3 renderer, all from local packages. Any other request is refused and recorded.
 *
 * The adapter is the npm build, which loads the page's MathJax, or the browser ESM build, which
 * bundles its own. The browser build is served under `/copy-<n>/` as well: each prefix is a
 * separate set of modules, as each element that bundles the adapter has its own.
 */
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';

const ORIGIN = 'http://pie.test';
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(packageDir, 'package.json'));
const mathjaxDir = dirname(require.resolve('mathjax/package.json'));
const fromMathjax = createRequire(join(mathjaxDir, 'package.json'));

/**
 * jsDelivr packages MathJax 4.1.3 loads, served from the installed copies: the component build,
 * its font and mhchem's font extension, which it requests unversioned, and the speech worker the
 * bundled engine loads from `@mathjax/src`.
 */
const CDN_PACKAGES: Record<string, string> = {
  mathjax: mathjaxDir,
  '@mathjax/mathjax-newcm-font': dirname(
    fromMathjax.resolve('@mathjax/mathjax-newcm-font/package.json')
  ),
  '@mathjax/mathjax-mhchem-font-extension': dirname(
    require.resolve('@mathjax/mathjax-mhchem-font-extension/package.json')
  ),
  '@mathjax/src': dirname(require.resolve('@mathjax/src/package.json')),
};

/** Which build of the adapter `/adapter.js` serves. */
export type Build = 'npm' | 'browser';

const BROWSER_DIST = join(packageDir, 'dist', 'browser');

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

/** Opens a page holding `body`, serving the built adapter, MathJax 4 and the legacy renderer. */
export async function openPage(page: Page, body: string, build: Build = 'npm') {
  const unserved: string[] = [];
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
  await page.route(`${ORIGIN}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname === '/') {
      const html = `<!doctype html><html><head><meta charset="utf-8"></head>${body}</html>`;
      return route.fulfill({ contentType: 'text/html', body: html });
    }
    if (pathname === '/adapter.js') {
      return route.fulfill({
        contentType: 'application/javascript',
        body: readFileSync(
          build === 'npm' ? join(packageDir, 'dist', 'index.js') : join(BROWSER_DIST, 'index.js')
        ),
      });
    }
    const browserFile = pathname.match(/^\/(?:copy-\d+\/)?([\w.-]+\.js)$/)?.[1];
    if (browserFile && build === 'browser' && existsSync(join(BROWSER_DIST, browserFile))) {
      return route.fulfill({
        contentType: 'application/javascript',
        body: readFileSync(join(BROWSER_DIST, browserFile)),
      });
    }
    if (pathname === '/legacy-renderer.js') {
      return route.fulfill({
        contentType: 'application/javascript',
        body: readFileSync(require.resolve('@pie-lib/math-rendering-module/module/index.js')),
      });
    }
    return route.fulfill({ status: 404 });
  });
  await page.route('https://cdn.jsdelivr.net/npm/**', (route) => {
    const url = route.request().url();
    if (LEGACY_ASSETS.some((prefix) => url.startsWith(prefix))) return route.abort();
    const match = new URL(url).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)(?:@[^/]+)?\/(.+)$/);
    const dir = match && CDN_PACKAGES[match[1]];
    if (!match || !dir) {
      unserved.push(url);
      return route.abort();
    }
    const file = match[2];
    return route.fulfill({
      contentType: CONTENT_TYPES[file.split('.').pop() ?? ''] ?? 'application/octet-stream',
      body: readFileSync(join(dir, file)),
    });
  });

  await page.addInitScript(() => {
    const conflicts: string[] = [];
    Object.assign(window, { conflicts });
    window.addEventListener('pie-mathjax-version-conflict', (event) => {
      conflicts.push((event as CustomEvent<{ condition: string }>).detail.condition);
    });
  });
  await page.goto(`${ORIGIN}/`);
  return { unserved, errors };
}

export function renderWithAdapter(page: Page, id: string, url = '/adapter.js') {
  return page.evaluate(
    async ([target, adapterUrl]) => {
      const adapter = await import(adapterUrl);
      await adapter.createMathjaxRenderer()(document.getElementById(target));
    },
    [id, url]
  );
}
