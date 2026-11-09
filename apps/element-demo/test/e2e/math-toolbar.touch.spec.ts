import { expect, test, type Locator, type Page } from '@playwright/test';
import { shownText } from './math-keypad-helpers';
import { deliveryContainer, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchTap, waitForSettled } from './touch-helpers';

/**
 * Can a learner enter math through the rich-text editor's math toolbar by touch?
 *
 * `extended-text-entry` (with `mathInput` on) opens the same `@pie-lib/math-input` keypad that
 * `math-keypad.touch.spec.ts` covers, but inside the editor's toolbar, which has its own
 * click-outside handling and focus management (see editable-html-math-toolbar.spec.ts, PIE-1115).
 * A bug in how the toolbar opens, keeps focus or closes would not show in the `math-inline` spec.
 *
 * Taps "Insert math", taps keys one at a time and checks, under the `touch` project (and
 * `touch-phone`, which runs every touch spec):
 *
 * - after every tap the toolbar's math field shows one more key than before, and still does a
 *   moment later - one tap, one key, with no late second one;
 * - after Done, the editor holds one math node with exactly what was tapped. Done is covered by
 *   other keys once the field has content, so that is a `test.fixme` (see DONE_MECHANISM).
 *
 * The first key tapped after the toolbar opens is often lost, with a mouse as well (see
 * FIRST_KEY_MECHANISM), so it is a `test.fixme` of its own and the sequence starts from whatever the
 * first tap left. The demo session for this
 * element does not change while the editor is used (it stays `value: ""`, with typing through the
 * keyboard as well), so the editor's own math node is what the spec reads.
 *
 * `explicit-constructed-response` has no math toolbar in its delivery view, so it is not covered.
 */

async function openToolbar(page: Page) {
  await assertTouchEnabled(page);
  await openDeliverRoute(page, 'extended-text-entry');

  const editor = deliveryContainer(page).locator('[contenteditable="true"]').first();
  await touchTap(page, editor);
  await touchTap(page, page.locator('button[aria-label="Insert math"]').first());

  const toolbar = page.locator('[data-toolbar-for]');
  await expect(toolbar).toBeVisible();
  // The toolbar opens before its `math-field` has mounted and taken focus, and the field starts
  // empty when it does: a key tapped in that gap is wiped. A learner waits for the toolbar to
  // settle; so does this.
  await expect(toolbar.locator('math-field')).toBeFocused();
  await waitForSettled(toolbar);
  return { editor, toolbar };
}

/** The editor's one math node, as text with the delimiters and spacing taken out. */
async function mathText(editor: Locator): Promise<string> {
  const math = editor.locator('.node-math');
  await expect(math).toHaveCount(1);
  return ((await math.first().textContent()) ?? '').replace(/[\s$]/g, '');
}

const JIRA = 'https://illuminate.atlassian.net/browse/';

const DONE_MECHANISM =
  "Once the field holds something, the toolbar's Done button (28x28px) is covered by keypad keys. " +
  'Hit-testing a 3x3 grid of points over it after 1, 1, 2 were tapped finds the fraction key ' +
  'across the top and middle and the Dot multiplier key along the bottom: no point reaches Done, ' +
  'so a tap on it presses one of those keys and the toolbar stays open. With the field empty Done ' +
  'is reachable. Seen at the touch viewport; a mouse click is blocked the same way ' +
  '(Playwright: another key "intercepts pointer events"). Look at the layout of ' +
  'math-toolbar/src/index.tsx and done-button.tsx.';

const FIRST_KEY_MECHANISM =
  'The first key tapped after Insert math opens the toolbar is lost in about two runs in three, ' +
  'with a mouse click as well as a tap, and however long the toolbar has been open (1s and 2.5s ' +
  'tried). The key does act - focus moves to it and back to the `math-field` - but the field ' +
  'stays empty. Once, the field showed "1" and was emptied about 10ms later. Every key tapped ' +
  'after it registers, and typing on the keyboard is unaffected. Not traced: look at how ' +
  'math-toolbar/src/editor-and-pad.tsx `onClick` (`this.input.write`) and `onEditorChange` hand ' +
  "the toolbar's `latex` back to the editor, and at the node view's own initial value in " +
  'editable-html-tip-tap/src/extensions/math.tsx.';

test.describe('math toolbar under touch', () => {
  test.fixme('extended-text-entry: the first toolbar keypad tap registers', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: 'fixme', description: FIRST_KEY_MECHANISM },
      { type: 'issue', description: `${JIRA}PIE-1509` }
    );
    const { toolbar } = await openToolbar(page);
    const field = toolbar.locator('math-field').first();

    await touchTap(page, toolbar.getByRole('button', { name: 'one', exact: true }).first(), {
      holdMs: 100,
    });

    await expect.poll(() => shownText(field), { timeout: 3_000 }).toBe('1');
  });

  // What works today: the keys after the first. The first is tapped and whatever it left in the
  // field is the starting point, so the case above can be un-fixme'd without a gap.
  test('extended-text-entry: each toolbar keypad tap after the first registers once', async ({
    page,
  }) => {
    const { editor, toolbar } = await openToolbar(page);
    const field = toolbar.locator('math-field').first();
    const shown = () => shownText(field);
    const tap = (name: string) =>
      touchTap(page, toolbar.getByRole('button', { name, exact: true }).first(), { holdMs: 100 });

    await tap('one');
    await page.waitForTimeout(500);
    let expected = await shown();

    // 1, 2, 3: each adds exactly one character. A doubled tap adds two, a dropped one none.
    for (const [name, digit] of [
      ['one', '1'],
      ['two', '2'],
      ['three', '3'],
    ]) {
      await tap(name);
      expected += digit;
      await expect.poll(shown, { timeout: 3_000 }).toBe(expected);
      // A late compatibility `mousedown` would add a second key after the first match.
      await page.waitForTimeout(250);
      expect(await shown()).toBe(expected);
    }
  });

  // Done is the learner's way to finish, and the editor keeping what was tapped is what the keys
  // are for.
  test.fixme('extended-text-entry: a tap on Done closes the toolbar with exactly what was tapped', async ({
    page,
  }, testInfo) => {
    testInfo.annotations.push(
      { type: 'fixme', description: DONE_MECHANISM },
      { type: 'issue', description: `${JIRA}PIE-1473` }
    );
    const { editor, toolbar } = await openToolbar(page);
    const field = toolbar.locator('math-field').first();
    for (const name of ['one', 'two', 'three']) {
      await touchTap(page, toolbar.getByRole('button', { name, exact: true }).first(), {
        holdMs: 100,
      });
      await page.waitForTimeout(400);
    }
    const expected = await shownText(field);

    await touchTap(page, page.locator('button[aria-label="Done"]').first());
    await expect(toolbar).toBeHidden();

    expect(await mathText(editor)).toBe(expected);
  });
});
