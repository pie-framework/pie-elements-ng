import { test, expect, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';

/**
 * image-cloze-association's screen reader announcements, driven by real key presses on the venn demo:
 * 3 drop areas holding up to 2 choices each, and 4 choices that cannot be reused. This checks that the
 * page puts the spec's text in the focused element's name or in a live region; it cannot prove what a
 * screen reader speaks, so docs/screen-reader-test-cases.md still lists the manual checks.
 */

const ANY_CHOICE = /^Answer choice: /;
const BOTH = 'both zebras and horses';
const HORSES = 'horses only';

/** The text of dnd-kit's own live region, which carries the keyboard drag as it unfolds. */
const dragRegion = (page: Page) => page.locator('[id^="DndLiveRegion"]').first();

/** The element's own live region, which carries what a drop did. */
const resultRegion = (page: Page) => deliveryContainer(page).locator('[role="status"]').first();

const areasHolding = async (page: Page): Promise<number[]> =>
  ((await getSessionState(page))?.answers ?? []).map((a: { containerIndex: number }) => a.containerIndex);

/** The keyboard sensor listens for keys from the task after a pick-up, so each key waits a moment. */
async function pressInTurn(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
}

/** Focuses the choice named `text`, in the pool or in a drop area. */
const choice = (page: Page, text: string) =>
  deliveryContainer(page).getByRole('button', { name: new RegExp(`^Answer choice: ${text}( in drop area .*)?$`) }).first();

/** What the learner hears for the focused element: its name, and the instruction read after it. */
const focusedName = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el?.getAttribute('aria-label') ?? el?.textContent ?? '';
  });

test.describe('image-cloze-association: screen reader announcements', () => {
  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'image-cloze-association', 'venn');
    await expect(deliveryContainer(page).getByRole('button', { name: ANY_CHOICE }).first()).toBeVisible();
  });

  test('the intro reads rows 1 to 4 after the prompt', async ({ page }) => {
    const paragraphs = await deliveryContainer(page)
      .locator('div[style*="white-space: nowrap"]:not([role="status"])')
      .allTextContents();

    expect(paragraphs[0]).toMatch(
      /^The image shows .*\. It has 3 drop areas, which can each hold up to \d+ answer choices\. There are 4 answer choices, which cannot be reused\.$/,
    );
    expect(paragraphs[1]).toBe(
      'Use TAB to move between answer choices and drop areas, ENTER to select/drop, and ESC to cancel.',
    );
    expect(paragraphs.slice(2, 5).every((p) => /^Drop area .+ is empty\.$/.test(p))).toBe(true);
    expect(paragraphs[5]).toMatch(
      /^4 available answer choices\. (Answer choice: .+ ){4}End of available answer choices\. Use TAB to move to an answer choice\.$/,
    );
  });

  test('rows 5 and 7: a tile is named, and Enter selects it', async ({ page }) => {
    const grass = choice(page, 'grass');

    await grass.focus();
    await expect(grass).toHaveAttribute('aria-label', 'Answer choice: grass');
    // The instruction is read after the name, through aria-describedby.
    const describedBy = await grass.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Press ENTER to select.');

    await page.keyboard.press('Enter');
    await expect(dragRegion(page)).toHaveText(
      'Selected answer choice grass. Use TAB to move to a drop area.',
    );
  });

  test('rows 9 and 11: the areas and the pool are read while a choice is carried', async ({ page }) => {
    await choice(page, 'grass').focus();
    await pressInTurn(page, ['Enter', 'Tab']);
    await expect(dragRegion(page)).toHaveText(
      /^Selected drop area .+\. Press ENTER to move selected answer choice grass here or TAB to move to a different drop area\.$/,
    );

    // Tab on, past the areas, to the pool.
    for (let i = 0; i < 3; i += 1) {
      await pressInTurn(page, ['Tab']);
    }
    await expect(dragRegion(page)).toHaveText(
      'Press ENTER to leave selected answer choice grass unplaced or TAB to move to a drop area.',
    );
  });

  test('rows 8 and 15: Esc, and Enter on the pool, both end the selection', async ({ page }) => {
    await choice(page, 'stripes').focus();
    await pressInTurn(page, ['Enter', 'Escape']);
    await expect(dragRegion(page)).toHaveText(
      'Answer choice stripes is no longer selected. Use TAB to move to an answer choice.',
    );
    expect(await areasHolding(page)).toEqual([]);
  });

  test('rows 12, 6, 13, 10 and 14: place, focus, move and remove', async ({ page }) => {
    // Row 12: place grass in the first area Tab reaches.
    await choice(page, 'grass').focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect.poll(() => areasHolding(page)).toHaveLength(1);
    await expect(async () => {
      expect(await focusedName(page)).toMatch(/^Placed answer choice grass in .+ drop area\./);
    }).toPass({ timeout: 3000 });
    const first = (await areasHolding(page))[0];

    // Row 6: a placed tile is named with its area.
    const placedGrass = choice(page, 'grass');
    await placedGrass.focus();
    await expect(placedGrass).toHaveAttribute('aria-label', /^Answer choice: grass in drop area .+$/);

    // Row 13: carried on to another area.
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect.poll(async () => (await areasHolding(page))[0]).not.toBe(first);
    await expect(async () => {
      expect(await focusedName(page)).toMatch(/^Moved answer choice grass from .+ drop area to .+ drop area\./);
    }).toPass({ timeout: 3000 });

    // Row 10, then row 14: carried to the pool.
    await choice(page, 'grass').focus();
    await pressInTurn(page, ['Enter']);
    for (let i = 0; i < 3; i += 1) {
      await pressInTurn(page, ['Tab']);
      const text = await dragRegion(page).textContent();
      if (text?.startsWith('Press ENTER to remove')) break;
    }
    await expect(dragRegion(page)).toHaveText(
      /^Press ENTER to remove selected answer choice grass from .+ drop area or TAB to move to a drop area\.$/,
    );
    await pressInTurn(page, ['Enter']);
    await expect.poll(() => areasHolding(page)).toEqual([]);
    await expect(async () => {
      expect(await focusedName(page)).toMatch(/^Removed answer choice grass from .+ drop area\./);
    }).toPass({ timeout: 3000 });
  });

  test('row 12: a full area refuses the drop, says why on screen and to a screen reader', async ({ page }) => {
    const sentence =
      /You’ve reached the limit of \d+ responses per area\. To add another response, one must first be removed\./;
    const root = deliveryContainer(page);

    // Fill one area with two choices by click, then carry a third to it by keyboard.
    for (const text of ['grass', 'wild']) {
      await choice(page, text).click();
      // Empty, the area is a button; once it holds a choice it is a group.
      await root.getByRole('button', { name: BOTH, exact: true }).or(root.getByRole('group', { name: BOTH, exact: true })).click();
      await page.waitForTimeout(300);
    }
    await expect.poll(() => areasHolding(page)).toHaveLength(2);

    await choice(page, 'pets').click();
    await root.getByRole('group', { name: BOTH, exact: true }).click();

    await expect(resultRegion(page)).toHaveText(sentence);
    await expect(root.getByText(sentence).first()).toBeVisible();
    await expect(root.getByText('Full', { exact: true })).toHaveCount(0);
    expect(await areasHolding(page)).toHaveLength(2);
  });

  test('the mouse path never speaks the keyboard instructions', async ({ page }) => {
    const root = deliveryContainer(page);

    await choice(page, 'grass').click();
    await expect(resultRegion(page)).toContainText('Selected answer choice grass.');
    await expect(dragRegion(page)).not.toContainText('Press ENTER to move selected answer choice');
    await expect(root.getByText(HORSES).first()).toBeVisible();
  });

  test('no announcement talks about progress or completeness', async ({ page }) => {
    await choice(page, 'grass').focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await page.waitForTimeout(1200);

    const heard = [await resultRegion(page).textContent(), await dragRegion(page).textContent(), await focusedName(page)];
    for (const text of heard) {
      expect(text ?? '').not.toMatch(/\d+ of \d+ (drop|response) areas|complete|incomplete|filled/i);
    }
  });
});
