/**
 * Math in a control, named from the hidden MathML once it is typeset. Browsers leave MathML out of
 * the name a button takes from its content, so these buttons have none until the math is labelled.
 */
import { expect, type Page, test } from '@playwright/test';
import { ADAPTER_URL, type Build, openPage } from './harness';

const BODY = `<body>
  <button id="math-only">\\(x = -\\frac{7}{6}\\)</button>
  <button id="mixed">\\(\\left(9.7 + \\sqrt{25}\\right)\\) feet</button>
  <label id="choice"><input type="radio" name="choice">\\(\\frac{4}{12}\\)</label>
  <button id="plain">Antigone</button>
  <p id="prose">Simplify \\(\\frac{4}{12}\\).</p>
</body>`;

async function expectNamedControls(page: Page) {
  await expect(page.getByRole('button', { name: 'x equals negative 7 over 6' })).toHaveAttribute(
    'id',
    'math-only'
  );
  await expect(
    page.getByRole('button', {
      name: 'open parenthesis 9.7 plus square root of 25 close parenthesis feet',
    })
  ).toHaveAttribute('id', 'mixed');
  await expect(page.getByRole('radio', { name: '4 over 12' })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Antigone' })).toHaveCount(1);
  expect(await page.locator('#prose mjx-container').getAttribute('aria-label')).toBeNull();
}

for (const build of ['npm', 'browser'] as Build[]) {
  test(`${build} build: renderMath names math in controls from its hidden MathML`, async ({
    page,
  }) => {
    const { errors } = await openPage(page, BODY, build);

    await page.evaluate(async (url) => {
      const adapter = await import(url);
      await adapter.renderMath(document.body);
    }, ADAPTER_URL);

    await expectNamedControls(page);
    expect(errors).toEqual([]);
  });
}

test('a rerender from the menu names the math it replaces', async ({ page }) => {
  const { errors } = await openPage(page, BODY, 'npm');

  await page.evaluate(async (url) => {
    const adapter = await import(url);
    await adapter.renderMath(document.body);
    const mathJax = (
      window as { MathJax?: { startup: { document: { rerender(): Promise<void> } } } }
    ).MathJax;
    const before = document.querySelector('#math-only mjx-container');
    await mathJax?.startup.document.rerender();
    if (document.querySelector('#math-only mjx-container') === before) {
      throw new Error('The rerender kept the container');
    }
  }, ADAPTER_URL);

  await expectNamedControls(page);
  expect(errors).toEqual([]);
});

test('renderMath names math in controls after the player renderer typesets it', async ({
  page,
}) => {
  const { unserved } = await openPage(page, BODY, 'npm');

  await page.evaluate(async (url) => {
    const legacy = await import('/legacy-renderer.js');
    Object.assign(window, { '@pie-lib/math-rendering': legacy._dll_pie_lib__math_rendering });
    const adapter = await import(url);
    await adapter.renderMath(document.body);
  }, ADAPTER_URL);

  await expectNamedControls(page);
  // The refused legacy assets log load errors of their own.
  expect(unserved).toEqual([]);
});
