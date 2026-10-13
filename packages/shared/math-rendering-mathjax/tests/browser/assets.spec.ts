/**
 * Where MathJax's files load from, in a real browser: the URLs the page lists for them, the npm
 * root of the URL the adapter loaded from, the root the page sets, or none.
 */
import { expect, type Page, test } from '@playwright/test';
import {
  ADAPTER_URL,
  type Build,
  copyUrl,
  emittedAssetUrls,
  emittedUrl,
  NPM_ROOT,
  ORIGIN,
  openMenu,
  openPage,
  renderWithAdapter,
  UNROOTED_ADAPTER_URL,
} from './harness';

const BODY = `<body><div id="v4">\\(\\frac{1}{2} + \\ce{A -> B}\\)</div></body>`;

const PAGE_OPTIONS = '@pie-lib/math-rendering@2';

function storeSettings(page: Page, settings: Record<string, unknown>) {
  return page.addInitScript(
    (value) => localStorage.setItem('PIE-MathJax-Menu-Settings', value),
    JSON.stringify(settings)
  );
}

function setPageOptions(page: Page, opts: Record<string, unknown>) {
  return page.addInitScript(([key, value]) => Object.assign(window, { [key]: { opts: value } }), [
    PAGE_OPTIONS,
    opts,
  ] as const);
}

function warnings(page: Page) {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') messages.push(message.text());
  });
  return messages;
}

/** The served files other than the adapter's own, without the origin. */
const assetPaths = (served: string[]) =>
  served
    .filter((url) => !url.includes('/@pie-element/shared-math-rendering-mathjax@'))
    .map((url) => url.slice(ORIGIN.length));

/** The effects of the `pie-mathjax-no-asset-root` events the page has seen. */
const noAssetRootEffects = (page: Page) =>
  page.evaluate(() => (window as { noAssetRoot?: string[] }).noAssetRoot);

/** Waits for the speech the worker computes once enrichment is on. */
const speechReady = (page: Page) =>
  expect(page.locator('#v4 mjx-container')).toHaveAttribute('data-semantic-speech-none', /half/);

for (const build of ['npm', 'browser'] as Build[]) {
  test(`the ${build} build loads its fonts and speech from the npm root it loaded from`, async ({
    page,
  }) => {
    await storeSettings(page, { enrich: true });
    const { unserved, errors, served } = await openPage(page, BODY, build);

    await renderWithAdapter(page, 'v4');
    await speechReady(page);
    await page.evaluate(() => document.fonts.ready);

    const assets = assetPaths(served);
    expect(assets).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /^\/npm\/@mathjax\/mathjax-newcm-font@4\.1\.3\/chtml\/woff2\/.+\.woff2$/
        ),
        expect.stringMatching(
          /^\/npm\/@mathjax\/mathjax-mhchem-font-extension@4\.1\.3\/chtml\/woff2\/.+\.woff2$/
        ),
        '/npm/mathjax@4.1.3/sre/speech-worker.js',
        '/npm/mathjax@4.1.3/sre/mathmaps/en.json',
        ...(build === 'npm' ? ['/npm/mathjax@4.1.3/tex-mml-chtml.js'] : []),
      ])
    );
    expect(assets.filter((path) => !path.startsWith('/npm/'))).toEqual([]);
    expect(errors).toEqual([]);
    expect(unserved).toEqual([]);
  });
}

test('each copy of the browser build loads from its own npm root', async ({ page }) => {
  const { unserved, errors, served } = await openPage(page, BODY, 'browser');

  await renderWithAdapter(page, 'v4', copyUrl(1));
  await page.evaluate(() => document.fonts.ready);

  const assets = assetPaths(served);
  expect(assets.length).toBeGreaterThan(0);
  expect(assets.filter((path) => !path.startsWith('/copy-1/npm/@mathjax/'))).toEqual([]);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('the root the page sets wins over the one the adapter loaded from', async ({ page }) => {
  await setPageOptions(page, { assetRoot: '/mirror/npm/' });
  await storeSettings(page, { enrich: true });
  const { unserved, errors, served } = await openPage(page, BODY, 'browser');

  await renderWithAdapter(page, 'v4');
  await speechReady(page);
  await page.evaluate(() => document.fonts.ready);

  const assets = assetPaths(served);
  expect(assets).toEqual(
    expect.arrayContaining(['/mirror/npm/mathjax@4.1.3/sre/speech-worker.js'])
  );
  expect(assets.filter((path) => !path.startsWith('/mirror/npm/'))).toEqual([]);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('a bundle that lists each file the browser build loads needs no root', async ({ page }) => {
  await setPageOptions(page, { assetUrls: emittedAssetUrls() });
  await storeSettings(page, { enrich: true });
  const warned = warnings(page);
  const { unserved, errors, served } = await openPage(page, BODY, 'browser');

  await renderWithAdapter(page, 'v4', UNROOTED_ADAPTER_URL);
  await speechReady(page);
  await page.evaluate(() => document.fonts.ready);

  expect(served).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/\/emitted\/%40mathjax%2Fmathjax-newcm-font%404\.1\.3%2F.+\.woff2$/),
      expect.stringMatching(
        /\/emitted\/%40mathjax%2Fmathjax-mhchem-font-extension%404\.1\.3%2F.+\.woff2$/
      ),
      emittedUrl('mathjax@4.1.3/sre/speech-worker.js'),
      emittedUrl('mathjax@4.1.3/sre/mathmaps/en.json'),
    ])
  );
  expect(served.filter((url) => !url.startsWith(`${ORIGIN}/emitted/`))).toEqual([]);
  expect(warned).toEqual([]);
  expect(await noAssetRootEffects(page)).toEqual([]);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('a file the page lists loads from its URL, and the rest from the root', async ({ page }) => {
  const listed = [
    'mathjax@4.1.3/sre/mathmaps/en.json',
    '@mathjax/mathjax-newcm-font@4.1.3/chtml/woff2/mjx-ncm-n.woff2',
  ];
  await setPageOptions(page, {
    assetUrls: Object.fromEntries(listed.map((path) => [path, emittedUrl(path)])),
  });
  await storeSettings(page, { enrich: true });
  const { unserved, errors, served } = await openPage(page, BODY, 'browser');

  await renderWithAdapter(page, 'v4');
  await speechReady(page);
  await page.evaluate(() => document.fonts.ready);

  const assets = assetPaths(served);
  expect(assets).toEqual(
    expect.arrayContaining([
      ...listed.map((path) => emittedUrl(path).slice(ORIGIN.length)),
      '/npm/mathjax@4.1.3/sre/speech-worker.js',
      '/npm/mathjax@4.1.3/sre/mathmaps/base.json',
    ])
  );
  for (const path of listed) expect(assets).not.toContain(`/npm/${path}`);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('without a root the browser build renders without web fonts and speech, reporting it once', async ({
  page,
}) => {
  await storeSettings(page, { enrich: true });
  const warned = warnings(page);
  const { unserved, errors, served } = await openPage(
    page,
    `<body>${BODY.slice('<body>'.length, -'</body>'.length)}<div id="other">\\(x^2\\)</div></body>`,
    'browser'
  );

  await renderWithAdapter(page, 'v4', UNROOTED_ADAPTER_URL);
  await renderWithAdapter(page, 'other', UNROOTED_ADAPTER_URL);
  await page.evaluate(() => document.fonts.ready);

  const math = page.locator('#v4 mjx-container');
  await expect(math).toHaveAttribute('jax', 'CHTML');
  await expect(math.locator('mjx-assistive-mml')).toHaveCount(1);
  expect(await math.getAttribute('data-semantic-speech-none')).toBeNull();
  expect(served).toEqual([]);
  const fontFaces = await page.evaluate(() =>
    [...document.querySelectorAll('style')].some((style) =>
      style.textContent?.includes('@font-face')
    )
  );
  expect(fontFaces).toBe(false);

  const [main, options] = await openMenu(page, '#v4', ['Options']);
  expect(main).toEqual(
    expect.arrayContaining(['Speech [disabled]', 'Braille [disabled]', 'Explorer [disabled]'])
  );
  expect(options).toContain('Semantic Enrichment [disabled]');
  expect(warned).toEqual([expect.stringContaining('No asset root for MathJax')]);
  expect(warned[0]).toContain('MATH-RENDERING.md#assets');
  expect(await noAssetRootEffects(page)).toEqual(['no-web-fonts-or-speech']);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('without a root or srcUrl the npm build loads no MathJax, reporting an error once', async ({
  page,
}) => {
  const warned = warnings(page);
  const { unserved, errors, served } = await openPage(page, BODY);

  await renderWithAdapter(page, 'v4', UNROOTED_ADAPTER_URL);

  await expect(page.locator('#v4 mjx-container')).toHaveCount(0);
  expect(await page.evaluate(() => 'MathJax' in window)).toBe(false);
  expect(served).toEqual([]);
  expect(warned).toEqual([]);
  expect(errors).toEqual([expect.stringContaining('math stays untypeset')]);
  expect(await noAssetRootEffects(page)).toEqual(['untypeset']);
  expect(unserved).toEqual([]);
});

for (const build of ['npm', 'browser'] as Build[]) {
  test(`the ${build} build's speech language menu lists the locales the page names`, async ({
    page,
  }) => {
    await setPageOptions(page, { speechLocales: ['en', 'de'] });
    await storeSettings(page, { enrich: true });
    const { unserved, errors } = await openPage(page, BODY, build);

    await renderWithAdapter(page, 'v4', ADAPTER_URL);
    await speechReady(page);

    const [, , languages] = await openMenu(page, '#v4', ['Speech', 'Language']);
    expect(languages).toEqual(['English', 'German']);
    expect(errors).toEqual([]);
    expect(unserved).toEqual([]);
  });
}

test('a root the page sets reaches a page MathJax the npm build loads', async ({ page }) => {
  await setPageOptions(page, { assetRoot: `${NPM_ROOT}/` });
  const { unserved, errors, served } = await openPage(page, BODY);

  await renderWithAdapter(page, 'v4', UNROOTED_ADAPTER_URL);

  await expect(page.locator('#v4 mjx-container')).toHaveAttribute('jax', 'CHTML');
  expect(assetPaths(served)).toEqual(
    expect.arrayContaining(['/npm/mathjax@4.1.3/tex-mml-chtml.js'])
  );
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});
