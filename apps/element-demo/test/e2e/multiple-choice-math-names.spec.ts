import { expect, type Page, test } from '@playwright/test';

// PIE-1244: the choice group is named "Answer choices", with the prompt before it, under both
// choice-naming patterns. By default a choice is named from its label, its math labelled with
// speech (#404). With `&mathNames=outside` the demo answers the accessibility context with
// `mathOutsideNames`, and a choice holding math is named by its key and a note while its MathML
// stays in the content. Checked under the MathJax 4 adapter (esm) and the legacy MathJax 3 renderer
// (iife). The prompt and every choice of this demo hold TeX.
const DELIVER_URL = '/multiple-choice/deliver?mode=gather&role=student&demo=math-algebra-quadratic';

/**
 * The names Chromium's accessibility tree gives the player's nodes of `role`. Playwright's
 * `toHaveAccessibleName` runs its own name computation, which keeps MathML tokens the browser
 * leaves out, so it would pass where a screen reader hears the math missing.
 */
async function browserNames(page: Page, role: string): Promise<string[]> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Accessibility.enable');
  const { result } = await cdp.send('Runtime.evaluate', {
    expression: "document.querySelector('pie-element-player')",
  });
  const { nodes } = await cdp.send('Accessibility.queryAXTree', {
    objectId: result.objectId,
    role,
  });
  await cdp.detach();
  return nodes.map((node) => String(node.name?.value ?? ''));
}

async function open(page: Page, player: 'esm' | 'iife', query = '') {
  await page.goto(`${DELIVER_URL}&player=${player}${query}`);
  const host = page.locator('pie-element-player');
  await expect(host).toHaveAttribute('strategy', player, { timeout: 30_000 });
  // IIFE bundles can build on first request.
  await expect(host.locator('label mjx-container').first()).toBeAttached({ timeout: 180_000 });
  await expect
    .poll(() => browserNames(page, 'radiogroup'), { timeout: 30_000 })
    .toEqual(['Answer choices']);
  // The prompt sits before the group, its MathML in the content.
  await expect(host.locator('.prompt mjx-assistive-mml math').first()).toBeAttached();
  expect(await host.locator('fieldset .prompt').count()).toBe(0);
  return host;
}

for (const player of ['esm', 'iife'] as const) {
  test(`names math choices with their speech by default under the ${player} player`, async ({
    page,
  }) => {
    test.setTimeout(240_000);
    await open(page, player);

    await expect
      .poll(() => browserNames(page, 'radio'), { timeout: 10_000 })
      .toEqual([
        expect.stringMatching(/^Pick the answer below, A x equals the fraction with numerator /),
        expect.stringMatching(/^Pick the answer below, B x equals /),
        expect.stringMatching(/^Pick the answer below, C x equals /),
        expect.stringMatching(/^Pick the answer below, D x equals /),
      ]);
  });

  test(`keeps math out of choice names on request under the ${player} player`, async ({ page }) => {
    test.setTimeout(240_000);
    const host = await open(page, player, '&mathNames=outside');

    await expect
      .poll(() => browserNames(page, 'radio'), { timeout: 10_000 })
      .toEqual([
        'A. Pick the answer below',
        'B. Pick the answer below',
        'C. Pick the answer below',
        'D. Pick the answer below',
      ]);
    // The renderer labels no math in a choice named from its key and note.
    await expect
      .poll(() => host.locator('label mjx-container[aria-label]').count(), { timeout: 10_000 })
      .toBe(0);
  });
}
