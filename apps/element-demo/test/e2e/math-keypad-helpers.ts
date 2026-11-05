import { expect, type Locator, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchTap, waitForSettled } from './touch-helpers';

/** Shared by the touch specs that enter math through `@pie-lib/math-input`'s on-screen keypad. */

/** Keys are labelled with the word for the digit, not the digit. */
const DIGIT_NAMES: Record<string, string> = {
  '0': 'zero',
  '1': 'one',
  '2': 'two',
  '3': 'three',
  '4': 'four',
  '5': 'five',
  '6': 'six',
  '7': 'seven',
  '8': 'eight',
  '9': 'nine',
};

/** The element's response that a learner taps to start answering. */
export const mathResponse = (root: Locator) =>
  root.locator('.static-math, .mq-editable-field').first();

/** The first response's value in a math-inline / math-templated session. */
export const mathValue = (session: any): string | undefined =>
  Object.values<any>(session?.answers ?? {})[0]?.value;

export const keypad = (page: Page) => page.locator('[role="tooltip"] [data-keypad]');

/** A key by its accessible name: a digit's word, or the name of an operator or edit key. */
export const key = (page: Page, name: string) =>
  keypad(page)
    .getByRole('button', { name: DIGIT_NAMES[name] ?? name, exact: true })
    .first();

/** What the response shows: its trailing text, since the field also carries screen-reader help text. */
export async function shownText(response: Locator): Promise<string> {
  const text = await response.evaluate((node) => {
    const field =
      node.closest('.mq-editable-field') ?? node.querySelector('.mq-editable-field') ?? node;
    return field.textContent ?? '';
  });
  return text.replace(/​/g, '').match(/[\d+−\-=]*$/)?.[0] ?? '';
}

/**
 * The response shows `expected`, and still does after a pause. A key that registers twice - touch,
 * then the late compatibility `mousedown` - changes the response after it first matched, so a
 * match alone would pass a doubled tap.
 */
export async function expectShown(response: Locator, expected: string): Promise<void> {
  await expect.poll(() => shownText(response), { timeout: 3_000 }).toBe(expected);
  await response.page().waitForTimeout(250);
  expect(await shownText(response)).toBe(expected);
}

/** Opens the deliver route, taps the response and waits for the keypad. */
export async function openKeypad(page: Page, element: string, demoId?: string): Promise<Locator> {
  await assertTouchEnabled(page);
  await openDeliverRoute(page, element, demoId);
  const root = deliveryContainer(page);
  await expect(root).toBeVisible();

  const response = mathResponse(root);
  await touchTap(page, response);
  await expect(keypad(page)).toBeVisible({ timeout: 10_000 });
  // It opens in a tooltip that grows into place, so a key's position read while it does is stale
  // by the time a resting finger lifts. A learner waits for the keypad to settle; so does this.
  await waitForSettled(keypad(page));
  return response;
}

export async function expectSessionValue(page: Page, expected: string): Promise<void> {
  await expect
    .poll(async () => mathValue(await getSessionState(page)), { timeout: 10_000 })
    .toBe(expected);
}
