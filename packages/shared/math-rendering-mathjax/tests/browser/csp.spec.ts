/**
 * MathJax under the content security policy pie-players documents for its `esm` and `preloaded`
 * strategies, with the adapter and its asset root on another origin, as an element loaded from a
 * CDN has them: math, its fonts and its speech load with no violation. Speech runs in a `blob:`
 * worker, so a policy whose `worker-src` leaves `blob:` out costs speech alone, and the math typeset
 * after the refusal still renders.
 */
import { expect, type Page, test } from '@playwright/test';
import { ADAPTER_URL, ASSET_ORIGIN, type Build, openPage } from './harness';

const NONCE = 'pie-csp-test';

/** The pie-players base policy plus its `esm` additions, with `ASSET_ORIGIN` as the CDN. */
const POLICY = [
  "default-src 'self'",
  `script-src 'nonce-${NONCE}' 'strict-dynamic'`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "object-src 'none'",
  "base-uri 'none'",
  `connect-src 'self' ${ASSET_ORIGIN}`,
  `font-src 'self' data: ${ASSET_ORIGIN}`,
].join('; ');

/** The page's own module script, which carries the nonce as a host's bundle does. */
const BODY = `<body>
  <div id="v4">\\(\\frac{1}{2} + \\ce{A -> B}\\)</div>
  <div id="later">\\(x^2\\)</div>
  <script type="module" nonce="${NONCE}">
    const { createMathjaxRenderer } = await import('${ASSET_ORIGIN}${ADAPTER_URL}');
    const render = createMathjaxRenderer();
    window.rendered = render(document.getElementById('v4'))
      .then(() => render(document.getElementById('later')))
      .then(
        () => 'typeset',
        (error) => 'rejected: ' + error.message
      );
  </script>
</body>`;

function enableEnrichment(page: Page) {
  return page.addInitScript(() =>
    localStorage.setItem('PIE-MathJax-Menu-Settings', JSON.stringify({ enrich: true }))
  );
}

const rendered = (page: Page) =>
  page
    .waitForFunction(() => (window as { rendered?: Promise<string> }).rendered)
    .then(() => page.evaluate(() => (window as { rendered?: Promise<string> }).rendered));

const violations = (page: Page) =>
  page.evaluate(() => (window as { violations?: string[] }).violations);

const math = (page: Page) => page.locator('#v4 mjx-container');

function warnings(page: Page) {
  const messages: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'warning') messages.push(message.text());
  });
  return messages;
}

for (const build of ['npm', 'browser'] as Build[]) {
  test(`the ${build} build loads math, fonts and speech under the documented policy`, async ({
    page,
  }) => {
    await enableEnrichment(page);
    const { unserved, errors, served } = await openPage(page, BODY, build, { csp: POLICY });

    expect(await rendered(page)).toBe('typeset');
    await expect(math(page)).toHaveAttribute('data-semantic-speech-none', /half/);
    await page.evaluate(() => document.fonts.ready);

    expect(served).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          new RegExp(`^${ASSET_ORIGIN}/npm/@mathjax/mathjax-newcm-font@4\\.1\\.3/chtml/woff2/`)
        ),
        `${ASSET_ORIGIN}/npm/mathjax@4.1.3/sre/speech-worker.js`,
        `${ASSET_ORIGIN}/npm/mathjax@4.1.3/sre/mathmaps/en.json`,
      ])
    );
    expect(await violations(page)).toEqual([]);
    expect(errors).toEqual([]);
    expect(unserved).toEqual([]);
  });

  test(`the ${build} build goes on typesetting without speech when worker-src refuses blob:`, async ({
    page,
  }) => {
    await enableEnrichment(page);
    const warned = warnings(page);
    const { unserved, errors } = await openPage(page, BODY, build, {
      csp: `${POLICY}; worker-src 'self'`,
    });

    expect(await rendered(page)).toBe('typeset');
    await expect(math(page)).toHaveAttribute('jax', 'CHTML');
    await expect(math(page).locator('mjx-assistive-mml')).toHaveCount(1);
    await expect(page.locator('#later mjx-container')).toHaveCount(1);
    expect(await math(page).getAttribute('data-semantic-speech-none')).toBeNull();
    expect(await violations(page)).toEqual(['worker-src blob']);
    expect(warned).toEqual([expect.stringContaining("MathJax's speech worker did not start")]);
    // The browser reports the refusal itself.
    expect(errors).toEqual([
      expect.stringContaining('violates the following Content Security Policy'),
    ]);
    expect(unserved).toEqual([]);
  });
}
