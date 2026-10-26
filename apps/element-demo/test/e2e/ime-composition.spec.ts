import { type CDPSession, type Locator, type Page, expect, test } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';

/**
 * The Enter that commits an IME composition must not act as a submit (PIE-1379). Chromium and
 * Firefox flag that keydown with `isComposing`; Safari fires `compositionend` first and reports the
 * keydown with `keyCode` 229 only. Drawing-response's text box saves and closes on Enter, so an
 * unguarded handler there saves the half-composed reading.
 *
 * CDP drives the composition the way a platform IME does: `Input.imeSetComposition` opens it and
 * `Input.insertText` commits it. A `rawKeyDown` carries no character, so the textarea's value stays
 * whatever the IME put there.
 */

const READING = 'にほん';
const COMMITTED = '日本';

async function openTextBox(page: Page, root: Locator): Promise<Locator> {
  await root.getByRole('button', { name: 'Text Entry' }).click();
  const stage = root.locator('canvas').first();
  const box = await stage.boundingBox();
  if (!box) {
    throw new Error('drawing-response: stage canvas has no bounding box');
  }
  // A new text entry sits at (55, 55) on the stage with its placeholder label.
  await page.mouse.dblclick(box.x + 80, box.y + 62);
  const textarea = root.locator('textarea:visible');
  await expect(textarea).toBeFocused();
  return textarea;
}

async function pressEnter(cdp: CDPSession, keyCode: number) {
  const key = {
    key: 'Enter',
    code: 'Enter',
    windowsVirtualKeyCode: keyCode,
    nativeVirtualKeyCode: keyCode,
  };
  await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...key });
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', ...key });
}

async function sessionText(page: Page): Promise<string> {
  return JSON.stringify((await getSessionState(page)) ?? {});
}

test.describe('IME composition: drawing-response text entry', () => {
  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'drawing-response');
  });

  test('the Enter that commits a composition leaves the text box open', async ({ page }) => {
    const root = deliveryContainer(page);
    const textarea = await openTextBox(page, root);
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.imeSetComposition', {
      text: READING,
      selectionStart: READING.length,
      selectionEnd: READING.length,
    });
    await expect(textarea).toHaveValue(READING);

    // Chromium order: the committing keydown arrives while the composition is open.
    await pressEnter(cdp, 13);
    await cdp.send('Input.insertText', { text: COMMITTED });

    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(COMMITTED);
    expect(await sessionText(page)).not.toContain(COMMITTED);

    // A second Enter, outside any composition, saves the committed text.
    await pressEnter(cdp, 13);
    await expect(textarea).toBeHidden();
    await expect.poll(() => sessionText(page)).toContain(COMMITTED);
  });

  test('a keyCode 229 Enter after compositionend leaves the text box open', async ({ page }) => {
    const root = deliveryContainer(page);
    const textarea = await openTextBox(page, root);
    const cdp = await page.context().newCDPSession(page);

    await cdp.send('Input.imeSetComposition', {
      text: READING,
      selectionStart: READING.length,
      selectionEnd: READING.length,
    });
    await cdp.send('Input.insertText', { text: COMMITTED });

    // Safari order: compositionend has fired, and the keydown reports the IME process key code.
    await pressEnter(cdp, 229);

    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveValue(COMMITTED);
    expect(await sessionText(page)).not.toContain(COMMITTED);
  });
});
