/**
 * A control that holds math, named from the hidden MathML MathJax typesets. Chrome leaves MathML
 * out of the name a button takes from its content, so these buttons have none until labelled.
 */
import { expect, test } from '@playwright/test';
import { ADAPTER_URL, type Build, openPage } from './harness';

const BODY = `<body>
  <button id="math-only">\\(x = -\\frac{7}{6}\\)</button>
  <button id="mixed">\\(\\left(9.7 + \\sqrt{25}\\right)\\) feet</button>
  <button id="plain">Antigone</button>
</body>`;

for (const build of ['npm', 'browser'] as Build[]) {
  test(`${build} build: a button holding math is named from its hidden MathML`, async ({
    page,
  }) => {
    const { errors } = await openPage(page, BODY, build);
    const names = () =>
      page
        .locator('button')
        .evaluateAll((buttons) => buttons.map((b) => b.getAttribute('aria-label')));

    await page.evaluate(async (url) => {
      const adapter = await import(url);
      await adapter.createMathjaxRenderer()(document.body);
      Object.assign(window, { adapter });
    }, ADAPTER_URL);

    // Without a label, Chrome names the math-only button nothing.
    expect(await page.locator('#math-only').ariaSnapshot()).not.toMatch(/^- button "/);

    await page.evaluate(() => {
      const { adapter } = window as unknown as {
        adapter: { mathContentName(e: Element): string | undefined };
      };
      for (const button of document.querySelectorAll('button')) {
        const name = adapter.mathContentName(button);
        if (name) button.setAttribute('aria-label', name);
      }
    });

    await expect(page.getByRole('button', { name: 'x equals negative 7 sixths' })).toHaveAttribute(
      'id',
      'math-only'
    );
    await expect(
      page.getByRole('button', {
        name: 'open parenthesis 9.7 plus square root of 25 close parenthesis feet',
      })
    ).toHaveAttribute('id', 'mixed');
    expect(await names()).toEqual([expect.any(String), expect.any(String), null]);
    expect(await page.getByRole('button', { name: 'Antigone' }).count()).toBe(1);
    expect(errors).toEqual([]);
  });
}
