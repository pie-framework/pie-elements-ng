/**
 * MathJax 4 output beside the legacy MathJax 3 renderer, in a real browser. The legacy renderer
 * rewrites every `[data-latex]` element on the page and replaces any `MJX-CHTML-styles` sheet;
 * the adapter's output has to survive both. Such a page is unsupported, so the adapter also has
 * to say so, once.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page, test } from '@playwright/test';

const ORIGIN = 'http://pie.test';
const packageDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const require = createRequire(join(packageDir, 'package.json'));
const mathjaxDir = dirname(require.resolve('mathjax/package.json'));
const fromMathjax = createRequire(join(mathjaxDir, 'package.json'));

/** jsDelivr packages MathJax 4.1.3 loads, served from the installed copies. */
const CDN_PACKAGES: Record<string, string> = {
  mathjax: mathjaxDir,
  '@mathjax/mathjax-newcm-font': dirname(
    fromMathjax.resolve('@mathjax/mathjax-newcm-font/package.json')
  ),
};

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

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"></head>
<body style="font: 20px serif">
  <div id="v4">\\(\\frac{1}{2} + x^2\\)</div>
  <div id="v3">\\(y^3\\)</div>
</body></html>`;

async function openPage(page: Page) {
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
    if (pathname === '/') return route.fulfill({ contentType: 'text/html', body: PAGE });
    if (pathname === '/adapter.js') {
      return route.fulfill({
        contentType: 'application/javascript',
        body: readFileSync(join(packageDir, 'dist', 'index.js')),
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
    const match = new URL(url).pathname.match(/^\/npm\/((?:@[^/]+\/)?[^@/]+)@[^/]+\/(.+)$/);
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

function renderWithAdapter(page: Page, id: string) {
  return page.evaluate(async (target) => {
    const url = '/adapter.js';
    const adapter = await import(url);
    await adapter.createMathjaxRenderer()(document.getElementById(target));
  }, id);
}

/**
 * What the MathJax 4 formula looks like: its visual DOM, the font its glyphs use, its fraction.
 * The hidden MathML is left out: the legacy renderer sets `displaystyle` on every `<math>` on the
 * page, which screen readers read but nothing draws.
 */
function measureV4(page: Page) {
  return page.evaluate(() => {
    const root = document.getElementById('v4') as HTMLElement;
    const container = root.querySelector('mjx-container');
    const box = (selector: string) =>
      container?.querySelector(`mjx-frac ${selector}`)?.getBoundingClientRect();
    const [numerator, line, denominator] = [box('mjx-num'), box('mjx-line'), box('mjx-den')];
    const middle = (rect: DOMRect) => rect.left + rect.width / 2;
    const glyph = container?.querySelector('mjx-c');
    return {
      text: root.textContent,
      dom: container?.querySelector('mjx-math')?.outerHTML,
      latexAttributes: root.querySelectorAll('[data-latex], [data-latex-item]').length,
      font: glyph ? getComputedStyle(glyph).fontFamily.split(',')[0].trim() : null,
      // Numerator over the fraction rule over the denominator, centred on one another.
      fractionStacked:
        !!numerator &&
        !!line &&
        !!denominator &&
        line.width > 0 &&
        numerator.bottom <= line.top + 1 &&
        line.bottom <= denominator.top + 1 &&
        Math.abs(middle(numerator) - middle(denominator)) < 1,
    };
  });
}

const headStylesheetIds = (page: Page) =>
  page.evaluate(() => [...document.head.querySelectorAll('style')].map((style) => style.id));

test('MathJax 4 output survives the legacy MathJax 3 renderer on the same page', async ({
  page,
}) => {
  const { unserved, errors } = await openPage(page);

  await renderWithAdapter(page, 'v4');
  // A menu setting change rerenders from the stored MathML, which carries data-latex again.
  await page.evaluate(async () => {
    const mathJax = (window as { MathJax?: any }).MathJax;
    await mathJax.startup.document.rerenderPromise();
  });
  const before = await measureV4(page);

  expect(before.latexAttributes).toBe(0);
  expect(before.font).toMatch(/^MJX-NCM-/);
  expect(before.fractionStacked).toBe(true);
  expect(await headStylesheetIds(page)).toContain('PIE-MJX-CHTML-styles');
  expect(await headStylesheetIds(page)).not.toContain('MJX-CHTML-styles');

  // The legacy renderer refuses to load over another MathJax global, so MathJax 4 is hidden
  // from it, as it is when a host page loads the two independently.
  await page.evaluate(async () => {
    delete (window as { MathJax?: unknown }).MathJax;
    const url = '/legacy-renderer.js';
    const legacy = await import(url);
    await legacy._dll_pie_lib__math_rendering.renderMath(document.getElementById('v3'));
  });

  await expect(page.locator('#v3 mjx-container')).toHaveCount(1);
  expect(await headStylesheetIds(page)).toEqual(
    expect.arrayContaining(['PIE-MJX-CHTML-styles', 'MJX-CHTML-styles'])
  );

  const after = await measureV4(page);
  expect(after.text).not.toContain('\\(');
  expect(after.dom).toBe(before.dom);
  expect(after.font).toBe(before.font);
  // MathJax 3's rules for the same mjx-* tags still tighten its spacing.
  expect(after.fractionStacked).toBe(true);

  // The refused legacy assets log load errors of their own.
  const reports = errors.filter((error) => error.startsWith('[math-rendering]'));
  expect(reports).toHaveLength(1);
  expect(reports[0]).toContain('Unsupported page (foreign-output-stylesheet)');
  expect(reports[0]).toContain('loading-strategies.md#one-mathjax-version-per-page');
  expect(await page.evaluate(() => (window as { conflicts?: string[] }).conflicts)).toEqual([
    'foreign-output-stylesheet',
  ]);
  expect(unserved).toEqual([]);
});

test('MathJax 4 alone, its menu open, reports nothing', async ({ page }) => {
  const { unserved, errors } = await openPage(page);

  await renderWithAdapter(page, 'v4');
  await renderWithAdapter(page, 'v3');
  await page.locator('#v4 mjx-container').click({ button: 'right' });
  await expect(page.locator('.CtxtMenu_Menu')).toBeVisible();

  expect(await headStylesheetIds(page)).toEqual(
    expect.arrayContaining(['MJX-Menu-styles', 'PIE-MJX-CHTML-styles'])
  );
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => (window as { conflicts?: string[] }).conflicts)).toEqual([]);
  expect(unserved).toEqual([]);
});
