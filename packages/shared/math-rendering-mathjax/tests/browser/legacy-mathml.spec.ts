/**
 * MathML the legacy renderer accepts and MathJax 4 reads differently, in a real browser. Each case
 * also typesets the same MathML straight through MathJax, which shows what the adapter changes.
 */
import { expect, type Page, test } from '@playwright/test';
import { openPage, renderWithAdapter } from './harness';

const STACK =
  '<math><mstack><mn>52</mn><msrow><mo>-</mo><mn>17</mn></msrow><msline/><mn>35</mn></mstack></math>';
const LONG_DIVISION =
  '<math><mlongdiv><mn>4</mn><mn>12</mn><mn>48</mn><mn>4</mn><msline length="1"/><mn>8</mn>' +
  '<mn>8</mn><msline length="1"/><mn>0</mn></mlongdiv></math>';
const PREFIXED = '<mml:math><mml:mfrac><mml:mn>1</mml:mn><mml:mn>2</mml:mn></mml:mfrac></mml:math>';
const INLINE_FRACTION = '<math><mfrac><mn>1</mn><mn>2</mn></mfrac></math>';

/** Typesets `html` in a new element through the page's MathJax, bypassing the adapter. */
function typesetDirectly(page: Page, id: string, html: string) {
  return page.evaluate(
    async ([target, content]) => {
      const element = document.createElement('div');
      element.id = target;
      element.innerHTML = content;
      document.body.appendChild(element);
      await (window as { MathJax?: any }).MathJax.typesetPromise([element]);
    },
    [id, html]
  );
}

test('elementary math typesets as the table it describes', async ({ page }) => {
  const { unserved, errors } = await openPage(
    page,
    `<body><div id="stack">${STACK}</div><div id="division">${LONG_DIVISION}</div></body>`
  );

  await renderWithAdapter(page, 'stack');
  await renderWithAdapter(page, 'division');
  await typesetDirectly(page, 'direct', STACK);

  for (const id of ['#stack', '#division']) {
    await expect(page.locator(`${id} mjx-merror`)).toHaveCount(0);
    await expect(page.locator(`${id} mjx-mtable`)).toHaveCount(1);
  }
  await expect(page.locator('#stack mjx-math')).toHaveText('52−1735');
  await expect(page.locator('#direct mjx-merror')).not.toHaveCount(0);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('prefixed MathML typesets', async ({ page }) => {
  const { unserved, errors } = await openPage(page, `<body><p id="v4">x ${PREFIXED}</p></body>`);

  await renderWithAdapter(page, 'v4');
  await typesetDirectly(page, 'direct', PREFIXED);

  await expect(page.locator('#v4 mjx-container mjx-mfrac')).toHaveCount(1);
  await expect(page.locator('#direct mjx-container')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('an inline MathML fraction keeps display size', async ({ page }) => {
  const { unserved, errors } = await openPage(
    page,
    `<body><p id="v4">a ${INLINE_FRACTION} b</p></body>`
  );

  await renderWithAdapter(page, 'v4');
  await typesetDirectly(page, 'direct', `a ${INLINE_FRACTION} b`);

  await expect(page.locator('#v4 mjx-mfrac mjx-mn[size]')).toHaveCount(0);
  await expect(page.locator('#direct mjx-mfrac mjx-mn[size="s"]')).toHaveCount(2);
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});
