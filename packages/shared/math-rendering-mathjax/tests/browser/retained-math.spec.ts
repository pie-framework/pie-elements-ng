/**
 * MathJax keeps each item it typesets in its document's list, and a menu setting change rerenders
 * every listed item. Math the page has removed has to leave the list, math still on the page has
 * to stay in it, and a typeset that fails must not fail the typesets after it.
 */
import { expect, type Page, test } from '@playwright/test';
import { ADAPTER_URL, openPage } from './harness';

const BODY = `<body style="font: 20px serif">
  <div id="item"></div>
  <div id="a"></div>
  <div id="b"></div>
</body>`;

const DOUBLE_STRUCK_FONT = '**/chtml/dynamic/double-struck.js';

type RenderWindow = { renders?: Promise<string>[] };

/** Starts rendering each element with the adapter, adding the renders to `window.renders`. */
function startRenders(page: Page, ...ids: string[]) {
  return page.evaluate(
    async ([url, ...targets]) => {
      const { createMathjaxRenderer } = await import(url);
      const render = createMathjaxRenderer();
      const pageWindow = window as RenderWindow;
      pageWindow.renders ??= [];
      for (const id of targets) {
        pageWindow.renders.push(
          render(document.getElementById(id)).then(
            () => 'typeset',
            (error: Error) => `rejected: ${error.message}`
          )
        );
      }
      // Lets each render reach MathJax before the caller goes on.
      await new Promise((resolve) => setTimeout(resolve, 0));
    },
    [ADAPTER_URL, ...ids]
  );
}

/** Waits for the renders started so far and takes them off `window.renders`. */
function renderResults(page: Page) {
  return page.evaluate(() => {
    const pageWindow = window as RenderWindow;
    const renders = pageWindow.renders ?? [];
    pageWindow.renders = [];
    return Promise.all(renders);
  });
}

const containers = (page: Page, id: string) => page.locator(`#${id} mjx-container`);

test('re-rendering an element keeps only its current math listed', async ({ page }) => {
  const { unserved, errors } = await openPage(page, BODY);

  const listed = await page.evaluate(async (url) => {
    const { createMathjaxRenderer } = await import(url);
    const render = createMathjaxRenderer();
    const element = document.getElementById('item') as HTMLElement;
    for (let i = 0; i < 200; i++) {
      element.innerHTML = `\\(\\frac{${i}}{2}\\) and \\(x^${i}\\)`;
      await render(element);
    }
    const mathDocument = (window as { MathJax?: any }).MathJax.startup.document;
    const items = [...mathDocument.math] as { typesetRoot: Element }[];
    return {
      items: items.length,
      detached: items.filter((item) => !item.typesetRoot.isConnected).length,
    };
  }, ADAPTER_URL);

  expect(listed).toEqual({ items: 2, detached: 0 });
  expect(await containers(page, 'item').count()).toBe(2);

  // A menu setting change rerenders the listed items, replacing their output.
  const replaced = await page.evaluate(async () => {
    const before = [...document.querySelectorAll('#item mjx-container')];
    await (window as { MathJax?: any }).MathJax.startup.document.rerenderPromise();
    const after = [...document.querySelectorAll('#item mjx-container')];
    return after.length === 2 && after.every((container) => !before.includes(container));
  });
  expect(replaced).toBe(true);

  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('a typeset that fails on a font file leaves later typesets working', async ({ page }) => {
  const { unserved } = await openPage(page, BODY);
  await page.route(DOUBLE_STRUCK_FONT, (route) => route.fulfill({ status: 404 }));

  await page.evaluate(() => {
    (document.getElementById('a') as HTMLElement).textContent = '\\(\\mathbb{R}\\)';
    (document.getElementById('b') as HTMLElement).textContent = '\\(x^2\\)';
  });
  await startRenders(page, 'a');
  expect(await renderResults(page)).toEqual([expect.stringMatching(/^rejected: .*double-struck/)]);

  await startRenders(page, 'b');
  expect(await renderResults(page)).toEqual(['typeset']);
  await expect(containers(page, 'b')).toHaveCount(1);
  expect(unserved).toEqual([]);
});

test('a render while another waits on a font file keeps the waiting math', async ({ page }) => {
  const { unserved, errors } = await openPage(page, BODY);
  let releaseFont!: () => void;
  const fontHeld = new Promise<void>((resolve) => {
    releaseFont = resolve;
  });
  await page.route(DOUBLE_STRUCK_FONT, async (route) => {
    await fontHeld;
    await route.fallback();
  });

  await page.evaluate(() => {
    (document.getElementById('a') as HTMLElement).textContent = '\\(x\\) in \\(\\mathbb{R}\\)';
    (document.getElementById('b') as HTMLElement).textContent = '\\(y\\)';
  });
  const fontRequested = page.waitForRequest(DOUBLE_STRUCK_FONT);
  await startRenders(page, 'a');
  // MathJax has typeset `x` and holds its output, not yet inserted, until the font file loads.
  await fontRequested;
  await startRenders(page, 'b');
  releaseFont();

  expect(await renderResults(page)).toEqual(['typeset', 'typeset']);
  await expect(containers(page, 'a')).toHaveCount(2);
  await expect(page.locator('#a')).not.toContainText('\\(');
  await expect(containers(page, 'b')).toHaveCount(1);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});
