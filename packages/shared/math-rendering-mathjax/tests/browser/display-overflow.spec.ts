/**
 * Displayed math too wide for its container, in a real browser. MathJax breaks it to the width the
 * container has at typeset; math it did not break to fit scrolls inside its own container.
 */
import { expect, type Page, test } from '@playwright/test';
import { type Build, openPage, renderWithAdapter } from './harness';

const FORMULA =
  '\\[ f(x) = 3x^2 + 5x - 2 + \\frac{4x^2 - 9}{2x + 3} - (x - 1)^2 + 7x - 12 + \\frac{x + 2}{3x - 1} \\]';

const BODY = `<body style="font: 16px serif">
  <div id="visible" style="width: 320px">${FORMULA}</div>
  <div id="hidden" style="width: 320px; display: none">${FORMULA}</div>
  <div id="narrowed" style="width: 700px">${FORMULA}</div>
</body>`;

function measure(page: Page, id: string) {
  return page.evaluate((target) => {
    const box = document.getElementById(target) as HTMLElement;
    const container = box.querySelector('mjx-container') as HTMLElement;
    return {
      lines: container.querySelectorAll('mjx-linebox').length,
      overflowsBox: box.scrollWidth > box.clientWidth,
      scrolls:
        getComputedStyle(container).overflowX === 'auto' &&
        container.scrollWidth > container.clientWidth,
    };
  }, id);
}

for (const build of ['npm', 'browser'] satisfies Build[]) {
  test(`displayed math breaks to fit, and scrolls where MathJax did not break it (${build} build)`, async ({
    page,
  }) => {
    const { unserved, errors } = await openPage(page, BODY, build);

    for (const id of ['visible', 'hidden', 'narrowed']) await renderWithAdapter(page, id);
    await page.evaluate(() => {
      (document.getElementById('hidden') as HTMLElement).style.display = 'block';
      (document.getElementById('narrowed') as HTMLElement).style.width = '320px';
    });

    const visible = await measure(page, 'visible');
    expect(visible.lines).toBeGreaterThan(1);
    expect(visible).toMatchObject({ overflowsBox: false, scrolls: false });
    // Typeset while hidden, or typeset wide and then narrowed: not broken to the width it shows at.
    for (const id of ['hidden', 'narrowed']) {
      const unbroken = { lines: 0, overflowsBox: false, scrolls: true };
      expect(await measure(page, id), id).toEqual(unbroken);
    }
    expect(errors).toEqual([]);
    expect(unserved).toEqual([]);
  });
}
