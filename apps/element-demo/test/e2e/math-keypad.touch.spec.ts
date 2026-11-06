import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  expectSessionValue,
  expectShown,
  key,
  keypad,
  mathResponse,
  openKeypad,
} from './math-keypad-helpers';
import { deliveryContainer } from './test-helpers';
import { rotateTo, touchTap } from './touch-helpers';

/**
 * Can a learner enter math by tapping the on-screen keypad?
 *
 * `@pie-lib/math-input`'s keypad listens for `touchstart` and `mousedown` on its container
 * (lib-react/math-input/src/keypad/index.tsx) and each key acts on `click`. A tap on a touchscreen
 * sends the touch events first and the compatibility mouse events and `click` after them, so a
 * keypad that moves or re-renders in between can drop a key, and one that handles both event kinds
 * can register it twice. Typing through `page.keyboard`, as the other math specs do, reaches
 * neither.
 *
 * For each element this taps into the response, taps keys one at a time and checks, under the
 * `touch` and `touch-phone` projects (see playwright.config.ts):
 *
 * - after every tap the response shows what has been tapped so far, and still does a moment later -
 *   one tap, one key, with no late second one;
 * - once the session has caught up, it holds exactly what was tapped.
 *
 * Each runs three ways, because a finger is not an instant, motionless tap: lifted at once, resting
 * for about 100 ms, and drifting a few pixels before it lifts. The keys are repeated on purpose: a
 * doubled tap turns 1-1 into 1-1-1 and a dropped one into 1. An operator key and Delete are tapped
 * as well, since they act through other code than the digits do.
 *
 * The math toolbar in extended-text-entry uses the same keypad but sits in an editor; it is covered by
 * math-toolbar.touch.spec.ts.
 */

const JIRA = 'https://illuminate.atlassian.net/browse/';

type KeypadCase = {
  element: string;
  demoId?: string;
  /** A confirmed defect that stops this element taking more than one key at a learner's pace. */
  knownDefect?: { mechanism: string; ticket: string };
};

const CASES: KeypadCase[] = [
  { element: 'math-inline' },
  {
    element: 'math-templated',
    knownDefect: {
      mechanism:
        'After the first key, the next key tapped a moment later (about 300ms; two taps in a ' +
        'burst work) is dropped. Its compatibility `mousedown` focuses the key, taking focus from ' +
        'the field, and the keypad tooltip is then repositioned - its transform moves from ' +
        'about translate(103px, 34px) to translate(636px, 34px) - before the compatibility ' +
        '`mouseup`, about 15ms later. `mouseup` and `click` land on the page, not on the key, so ' +
        'the key never acts, and the field is left blurred. A mouse sends `mousedown` and ' +
        '`mouseup` together and finishes before the move. Not traced to the code that moves ' +
        'it; math-templated/src/delivery/main.tsx `onBlur` and the tooltip `open` state are ' +
        'where to start. math-inline is unaffected.',
      ticket: 'PIE-1475',
    },
  },
];

/** How the finger meets the key. */
const FINGERS = [
  { name: 'lifted at once', tap: {} },
  { name: 'resting 100ms', tap: { holdMs: 100 } },
  { name: 'drifting 4px', tap: { driftPx: 4 } },
] as const;

/** Tapped in this order: the repeated 1 shows a doubled or dropped tap, which 1-2-3 would not. */
const TAPS = ['1', '1', '2', '3'];

test.describe('math keypad under touch', () => {
  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;
    const { knownDefect } = item;

    /** A test that needs more than one key: `fixme`, with the mechanism, where the element has the defect. */
    const sequence = (
      name: string,
      body: (args: { page: Page }, info: TestInfo) => Promise<void>
    ) => {
      if (!knownDefect) {
        test(name, body);
        return;
      }
      test.fixme(name, async ({ page }, testInfo) => {
        testInfo.annotations.push(
          { type: 'fixme', description: knownDefect.mechanism },
          { type: 'issue', description: `${JIRA}${knownDefect.ticket}` }
        );
        await body({ page }, testInfo);
      });
    };

    // What works on every element: the key that follows opening the keypad.
    test(`${title}: the first keypad tap registers once`, async ({ page }) => {
      const response = await openKeypad(page, item.element, item.demoId);

      await touchTap(page, key(page, '1'), { holdMs: 100 });
      await expectShown(response, '1');
      await expectSessionValue(page, '1');
    });

    for (const finger of FINGERS) {
      sequence(
        `${title}: each keypad tap registers once, finger ${finger.name}`,
        async ({ page }) => {
          const response = await openKeypad(page, item.element, item.demoId);

          let tapped = '';
          for (const digit of TAPS) {
            await touchTap(page, key(page, digit), finger.tap);
            tapped += digit;
            await expectShown(response, tapped);
          }

          await expectSessionValue(page, tapped);
        }
      );
    }

    sequence(`${title}: an operator key and Delete register once`, async ({ page }) => {
      const response = await openKeypad(page, item.element, item.demoId);

      // 1, +, 2, Delete, 3: Delete takes back the 2 and nothing else.
      const steps: [string, string][] = [
        ['1', '1'],
        ['+', '1+'],
        ['2', '1+2'],
        ['Delete', '1+'],
        ['3', '1+3'],
      ];
      for (const [name, shown] of steps) {
        await touchTap(page, key(page, name), { holdMs: 100 });
        await expectShown(response, shown);
      }

      await expectSessionValue(page, '1+3');
    });
  }
  // Turning the device with the keypad open moves its tooltip. The response must keep what was
  // tapped, and a learner must be able to carry on, reopening the keypad if the turn closed it.
  test('math-inline: a rotation with the keypad open keeps the response and the keypad usable', async ({
    page,
  }) => {
    const response = await openKeypad(page, 'math-inline');
    await touchTap(page, key(page, '1'), { holdMs: 100 });
    await expectShown(response, '1');

    const { width, height } = page.viewportSize()!;
    const landscape = width > height;
    await rotateTo(page, landscape ? 'portrait' : 'landscape');

    await expectShown(response, '1');
    await expectSessionValue(page, '1');

    if (!(await keypad(page).isVisible())) {
      await touchTap(page, mathResponse(deliveryContainer(page)));
      await expect(keypad(page)).toBeVisible({ timeout: 10_000 });
    }
    // A landscape phone is shorter than the keypad, so a learner scrolls to the key first.
    await key(page, '2').scrollIntoViewIfNeeded();
    await expect(key(page, '2')).toBeInViewport();
    await touchTap(page, key(page, '2'), { holdMs: 100 });
    await expectShown(response, '12');
    await expectSessionValue(page, '12');
  });
});
