/**
 * A choice order the controller shuffles in gather and saves through `updateSession` stays in the
 * session, and evaluate renders the same order.
 *
 * Every parity sample locks its choice order, so the spec serves the sample module with one unlocked.
 */

import { readFileSync } from 'node:fs';
import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer } from './test-helpers';

const DEMO_ID = 'variant-sr-vic';

async function serveUnlockedSample(page: Page) {
  const samples = JSON.parse(
    readFileSync(new URL('../../src/lib/samples/mc-populated-blank.json', import.meta.url), 'utf-8')
  );
  for (const demo of samples.demos) {
    if (demo.id === DEMO_ID) {
      demo.model.lockChoiceOrder = false;
    }
  }
  let served = false;
  await page.route('**/src/lib/samples/mc-populated-blank.json*', (route) => {
    served = true;
    return route.fulfill({
      contentType: 'text/javascript',
      body: `export default ${JSON.stringify(samples)};`,
    });
  });
  return () => served;
}

const hostSession = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(JSON.stringify((document.querySelector('pie-element-player') as any)?.session ?? {}))
  );

const choiceOrder = (page: Page) =>
  deliveryContainer(page)
    .locator('input[type="radio"]')
    .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value));

test('a shuffled choice order is kept from gather to evaluate', async ({ page }) => {
  const sampleServed = await serveUnlockedSample(page);
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${DEMO_ID}&player=esm`
  );
  const radios = deliveryContainer(page).locator('input[type="radio"]');
  await expect(radios).toHaveCount(4);
  expect(sampleServed(), 'the unlocked sample was not served').toBe(true);

  const gather = await hostSession(page);
  expect(gather.shuffledValues).toHaveLength(4);
  expect(gather.data?.shuffledValues).toEqual(gather.shuffledValues);
  expect(await choiceOrder(page)).toEqual(gather.shuffledValues);

  await page.click('[data-testid="role-instructor"]');
  await page.waitForURL(/mode=evaluate/);
  await expect(radios.first()).toBeDisabled();

  expect((await hostSession(page)).shuffledValues).toEqual(gather.shuffledValues);
  expect(await choiceOrder(page)).toEqual(gather.shuffledValues);
});
