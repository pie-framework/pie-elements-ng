/**
 * The browser ESM build, in a real browser: the adapter on the MathJax it bundles. The specs are
 * black-box, since that MathJax is reachable from the page only through its output and its menu.
 */
import { type Browser, expect, type Page, test } from '@playwright/test';
import { type Build, openPage, renderWithAdapter } from './harness';

const OWN_KEY = 'PIE-MathJax-Menu-Settings';

const conflicts = (page: Page) =>
  page.evaluate(() => (window as { conflicts?: string[] }).conflicts);

const headStylesheetIds = (page: Page) =>
  page.evaluate(() => [...document.head.querySelectorAll('style')].map((style) => style.id));

const pageMathJax = (page: Page) =>
  page.evaluate(() => (window as { MathJax?: { version?: string } }).MathJax?.version ?? null);

function storeSettings(page: Page, settings: Record<string, unknown>) {
  return page.addInitScript(
    ([name, value]) => localStorage.setItem(name, value),
    [OWN_KEY, JSON.stringify(settings)]
  );
}

/** The items of each open menu, `[disabled]` marking those that are. */
function openMenus(page: Page) {
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
async function openMenu(page: Page, selector: string, path: string[]) {
  await page.locator(`${selector} mjx-container`).click({ button: 'right' });
  for (const label of path) {
    await page.locator('.CtxtMenu_MenuItem', { hasText: label }).first().hover();
    await expect(page.locator('.CtxtMenu_Menu')).toHaveCount(path.indexOf(label) + 2);
  }
  return openMenus(page);
}

test('renders TeX and MathML on a MathJax of its own', async ({ page }) => {
  const { unserved, errors } = await openPage(
    page,
    `<body>
      <div id="tex">\\(\\frac{1}{2} + x^2\\)</div>
      <div id="mml"><math><mi>y</mi><mo>=</mo><mn>3</mn></math></div>
    </body>`,
    'browser'
  );

  await renderWithAdapter(page, 'tex');
  await renderWithAdapter(page, 'mml');

  await expect(page.locator('#tex mjx-container')).toHaveAttribute('jax', 'CHTML');
  await expect(page.locator('#mml mjx-container')).toHaveAttribute('jax', 'CHTML');
  await expect(page.locator('#tex mjx-assistive-mml math')).toHaveCount(1);
  expect(await pageMathJax(page)).toBeNull();
  expect(await headStylesheetIds(page)).toContain('PIE-MJX-CHTML-styles-1');
  expect(await headStylesheetIds(page)).not.toContain('MJX-CHTML-styles');
  expect(await page.evaluate(() => 'wgxpath' in window)).toBe(false);
  expect(errors).toEqual([]);
  expect(await conflicts(page)).toEqual([]);
  expect(unserved).toEqual([]);
});

/** Math whose output depends on the adapter's configuration and its MathML preprocessing. */
const PARITY_CASES: Record<string, string> = {
  tex: '\\(\\frac{1}{2} + \\abs{x}^2 \\parallel \\longdiv{12} + \\cancel{y} + \\ce{H2O} \\)',
  chemistry: '\\(\\ce{2H2 + O2 -> 2H2O} \\)',
  display: '\\[ \\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6} \\]',
  mathml: '<math><mi>y</mi><mo>=</mo><msqrt><mn>3</mn></msqrt></math>',
  stack:
    '<math><mstack><mn>52</mn><msrow><mo>-</mo><mn>17</mn></msrow><msline/><mn>35</mn></mstack></math>',
  prefixed: '<mml:math><mml:mfrac><mml:mn>1</mml:mn><mml:mn>2</mml:mn></mml:mfrac></mml:math>',
  fraction: 'a <math><mfrac><mn>1</mn><mn>2</mn></mfrac></math> b',
};

/** Each case's output on `build`, in a page of its own. */
async function renderCases(browser: Browser, build: Build) {
  const page = await browser.newPage();
  const body = Object.entries(PARITY_CASES)
    .map(([id, math]) => `<div id="${id}">${math}</div>`)
    .join('');
  const { unserved, errors } = await openPage(page, `<body>${body}</body>`, build);
  for (const id of Object.keys(PARITY_CASES)) await renderWithAdapter(page, id);
  const output = await page.evaluate(
    (ids) => ids.map((id) => document.getElementById(id)?.innerHTML),
    Object.keys(PARITY_CASES)
  );
  await page.close();
  return { output, unserved, errors };
}

test('renders what the npm build renders', async ({ browser }) => {
  const npm = await renderCases(browser, 'npm');
  const bundled = await renderCases(browser, 'browser');

  expect(bundled.output).toEqual(npm.output);
  expect(npm.output.every((html) => html?.includes('<mjx-container'))).toBe(true);
  expect([...npm.errors, ...bundled.errors]).toEqual([]);
  expect([...npm.unserved, ...bundled.unserved]).toEqual([]);
});

test("draws characters from the font ranges it bundles and mhchem's font extension", async ({
  page,
}) => {
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="v4">\\(\\mathbb{R} + \\mathfrak{g} + \\mathcal{L} + \\textsf{A} + \\ce{A <=> B}\\)</div></body>`,
    'browser'
  );

  await renderWithAdapter(page, 'v4');
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    const loaded = new Set(
      [...document.fonts].filter((font) => font.status === 'loaded').map((font) => font.family)
    );
    return [...document.querySelectorAll('#v4 mjx-c')]
      .map((glyph) => getComputedStyle(glyph).fontFamily.split(',').pop()?.trim() ?? '')
      .filter((family) => family !== 'MJX-NCM-N')
      .map((family) => [family, loaded.has(family)]);
  });

  expect(fonts).toEqual([
    ['MJX-NCM-DS', true],
    ['MJX-NCM-F', true],
    ['MJX-NCM-C', true],
    ['MJX-NCM-SS', true],
    ['MJX-MHC-M', true],
  ]);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('its menu offers what the page MathJax offers, less SVG output and collapsing', async ({
  page,
}) => {
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="v4">\\(\\frac{1}{2}\\)</div></body>`,
    'browser'
  );
  await renderWithAdapter(page, 'v4');

  const [main, settings, renderer] = await openMenu(page, '#v4', [
    'Math Settings',
    'Math Renderer',
  ]);
  expect(main).toEqual([
    'Show Math As',
    'Copy to Clipboard',
    'Math Settings',
    'Accessibility:',
    'Speech [disabled]',
    'Braille [disabled]',
    'Explorer [disabled]',
    'Options',
    'About MathJax',
    'MathJax Help',
  ]);
  expect(settings).toContain('Zoom Trigger');
  expect(renderer).toEqual(['CHTML', 'SVG [disabled]']);
  await page.keyboard.press('Escape');

  const [, options] = await openMenu(page, '#v4', ['Options']);
  expect(options).toEqual([
    'Semantic Enrichment',
    'Collapsible Math [disabled]',
    'Auto Collapse [disabled]',
    'Include in Tab Order',
    'Tabbing Focuses on [disabled]',
    'Include Hidden MathML',
  ]);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('speech, braille and the explorer run once a student turns enrichment on', async ({
  page,
}) => {
  await storeSettings(page, { enrich: true });
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="v4">\\(\\frac{1}{2} + x^2\\)</div></body>`,
    'browser'
  );

  await renderWithAdapter(page, 'v4');

  const math = page.locator('#v4 mjx-container');
  await expect(math).toHaveAttribute('data-semantic-speech-none', 'one half plus x squared');
  await expect(math).toHaveAttribute('data-semantic-braille', /.+/);
  await expect(math).toHaveAttribute('tabindex', '-1');
  const [main] = await openMenu(page, '#v4', []);
  expect(main).toEqual(expect.arrayContaining(['Speech', 'Braille', 'Explorer']));
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('stored settings naming SVG output or collapsing math leave it rendering', async ({
  page,
}) => {
  await storeSettings(page, { renderer: 'SVG', collapsible: true, zoom: 'Click' });
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="a">\\(\\frac{1}{2}\\)</div><div id="b">\\(x^2\\)</div></body>`,
    'browser'
  );

  // A renderer the menu cannot load would stall the first typeset and every one after it.
  await renderWithAdapter(page, 'a');
  await renderWithAdapter(page, 'b');

  await expect(page.locator('mjx-container[jax="CHTML"]')).toHaveCount(2);
  await expect(page.locator('mjx-container[jax="SVG"]')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test("runs beside the page's own MathJax 4 SVG build, which it leaves alone", async ({ page }) => {
  const { unserved, errors } = await openPage(
    page,
    `<body>
      <div id="host">\\(a^2\\)</div>
      <div id="v4">\\(\\frac{1}{2}\\)</div>
      <div id="host-later">\\(b^2\\)</div>
    </body>`,
    'browser'
  );
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        Object.assign(window, { MathJax: { startup: { elements: ['#host'] } } });
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-svg.js';
        script.onload = () => (window as any).MathJax.startup.promise.then(() => resolve(), reject);
        script.onerror = () => reject(new Error('tex-svg.js did not load'));
        document.head.appendChild(script);
      })
  );
  const hostMathJax = await page.evaluateHandle(() => (window as any).MathJax);

  await renderWithAdapter(page, 'v4');
  await page.evaluate(() =>
    (window as any).MathJax.typesetPromise([document.getElementById('host-later')])
  );

  await expect(page.locator('#host mjx-container')).toHaveAttribute('jax', 'SVG');
  await expect(page.locator('#v4 mjx-container')).toHaveAttribute('jax', 'CHTML');
  await expect(page.locator('#host-later mjx-container')).toHaveAttribute('jax', 'SVG');
  expect(await page.evaluate((mathJax) => mathJax === (window as any).MathJax, hostMathJax)).toBe(
    true
  );
  expect(await pageMathJax(page)).toBe('4.1.3');
  expect(errors).toEqual([]);
  expect(await conflicts(page)).toEqual([]);
  expect(unserved).toEqual([]);
});

test('reports the CHTML stylesheet of a MathJax 3 on the page, and only that', async ({ page }) => {
  const { unserved, errors } = await openPage(
    page,
    `<body style="font: 20px serif">
      <div id="v4">\\(\\frac{1}{2} + x^2\\)</div>
      <div id="v3">\\(y^3\\)</div>
    </body>`,
    'browser'
  );

  await renderWithAdapter(page, 'v4');
  const before = await page.locator('#v4 mjx-math').evaluate((math) => math.outerHTML);
  // The legacy renderer rewrites every [data-latex] element on the page.
  await page.evaluate(async () => {
    const url = '/legacy-renderer.js';
    const legacy = await import(url);
    await legacy._dll_pie_lib__math_rendering.renderMath(document.getElementById('v3'));
  });

  await expect(page.locator('#v3 mjx-container')).toHaveCount(1);
  expect(await page.locator('#v4 mjx-math').evaluate((math) => math.outerHTML)).toBe(before);
  expect(await headStylesheetIds(page)).toEqual(
    expect.arrayContaining(['PIE-MJX-CHTML-styles-1', 'MJX-CHTML-styles'])
  );
  expect(await pageMathJax(page)).toMatch(/^3\./);
  expect(await conflicts(page)).toEqual(['foreign-output-stylesheet']);
  // The refused legacy assets log load errors of their own.
  expect(errors.filter((error) => error.startsWith('[math-rendering]'))).toEqual([
    expect.stringContaining('Unsupported page (foreign-output-stylesheet)'),
  ]);
  expect(unserved).toEqual([]);
});

test('two copies on one page each run their own MathJax', async ({ page }) => {
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="a">\\(\\frac{1}{2}\\)</div><div id="b">\\(x^2\\)</div></body>`,
    'browser'
  );

  await renderWithAdapter(page, 'a', '/copy-1/index.js');
  await renderWithAdapter(page, 'b', '/copy-2/index.js');

  await expect(page.locator('#a mjx-container')).toHaveAttribute('jax', 'CHTML');
  await expect(page.locator('#b mjx-container')).toHaveAttribute('jax', 'CHTML');
  expect(await headStylesheetIds(page)).toEqual(
    expect.arrayContaining(['PIE-MJX-CHTML-styles-1', 'PIE-MJX-CHTML-styles-2'])
  );
  expect(await pageMathJax(page)).toBeNull();
  expect(errors).toEqual([]);
  expect(await conflicts(page)).toEqual([]);
  expect(unserved).toEqual([]);
});

test('starts with every option the adapter takes', async ({ page }) => {
  const fonts: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.woff2')) fonts.push(request.url());
  });
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="v4">$x^2$</div></body>`,
    'browser'
  );

  await page.evaluate(async () => {
    const url = '/adapter.js';
    const adapter = await import(url);
    await adapter.createMathjaxRenderer({
      accessibility: false,
      loadFonts: false,
      useSingleDollar: true,
    })(document.getElementById('v4'));
  });

  await expect(page.locator('#v4 mjx-container')).toHaveAttribute('jax', 'CHTML');
  await expect(page.locator('#v4 mjx-assistive-mml')).toHaveCount(0);
  // Without loadFonts the font URL is empty, so the page serves the fonts, as the npm build does.
  await page.evaluate(() => document.fonts.ready);
  expect(fonts).toEqual(['http://pie.test/mjx-ncm-zero.woff2', 'http://pie.test/mjx-ncm-n.woff2']);
  expect(errors).toEqual(fonts.map(() => expect.stringContaining('404 (Not Found)')));
  expect(unserved).toEqual([]);
});
