import { test, expect, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';

/**
 * categorize's screen reader announcements, driven by real key presses on two demos: `screen-reader-list`
 * (2 categories holding up to 2 choices each, 6 choices that cannot be reused) and `screen-reader-matrix`
 * (6 categories in a 2 by 3 matrix holding 1 choice each). This checks that the page puts the spec's text
 * in the focused element's name or in a live region; it cannot prove what a screen reader speaks, so
 * docs/screen-reader-test-cases.md still lists the manual checks.
 */

const YES = 'Structure of Say Yes to Solar Energy';
const PROBLEM = 'identifies a problem and suggests a solution';
const ARGUMENTS = 'gives main arguments supported by details';

/** dnd-kit's own live region, which the element leaves empty: two regions compete in JAWS. */
const dndRegion = (page: Page) => page.locator('[id^="DndLiveRegion"]').first();

/** The element's one live region, which carries everything announced while selecting and placing. */
const resultRegion = (page: Page) => deliveryContainer(page).locator('[role="status"]').first();

const placed = async (page: Page): Promise<Record<string, string[]>> =>
  Object.fromEntries(
    ((await getSessionState(page))?.answers ?? [])
      .filter((a: { choices: string[] }) => a.choices.length > 0)
      .map((a: { category: string; choices: string[] }) => [a.category, a.choices])
  );

/** The keyboard sensor listens for keys from the task after a pick-up, so each key waits a moment. */
async function pressInTurn(page: Page, keys: string[]) {
  for (const key of keys) {
    await page.keyboard.press(key);
    await page.waitForTimeout(250);
  }
}

/** The choice named `text`, in the pool or in a category. */
const choice = (page: Page, text: string) =>
  deliveryContainer(page)
    .getByRole('button', {
      name: new RegExp(`^(.*\\. )?Answer choice: ${text}( in category .*)?$`),
    })
    .first();

/** What the learner hears for the focused element: its name. */
const focusedName = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el?.getAttribute('aria-label') ?? el?.textContent ?? '';
  });

const introParagraphs = (page: Page) =>
  deliveryContainer(page).locator('[data-categorize-intro]').allTextContents();

test.describe('categorize: screen reader announcements, categories in a list', () => {
  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'categorize', 'screen-reader-list');
    await expect(
      deliveryContainer(page)
        .getByRole('button', { name: /^Answer choice: / })
        .first()
    ).toBeVisible();
  });

  test('rows 1 to 4: the intro reads after the prompt', async ({ page }) => {
    const paragraphs = await introParagraphs(page);

    expect(paragraphs[0]).toBe(
      'The question has 2 categories, which can each hold up to 2 answer choices. There are 6 answer choices, which cannot be reused.'
    );
    expect(paragraphs[1]).toBe(
      'Use TAB to move between answer choices and categories, ENTER to select/drop, and ESC to cancel.'
    );
    expect(paragraphs[2]).toBe(`Category 1 ${YES} contains 0 answer choices.`);
    expect(paragraphs[3]).toBe(
      'Category 2 Structure of Say No to Solar Energy contains 0 answer choices.'
    );
    expect(paragraphs[4]).toMatch(
      /^6 available answer choices\. (Answer choice: .+? ){6}End of available answer choices\. Use TAB to move to an answer choice\.$/
    );
  });

  test('rows 5 and 7: a choice is named, and Enter selects it', async ({ page }) => {
    const tile = choice(page, PROBLEM);

    await tile.focus();
    await expect(tile).toHaveAttribute('aria-label', `Answer choice: ${PROBLEM}`);
    const describedBy = await tile.getAttribute('aria-describedby');
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText('Press ENTER to select.');

    await page.keyboard.press('Enter');
    await expect(resultRegion(page)).toHaveText(
      `Selected answer choice ${PROBLEM}. Use TAB to move to a drop area.`
    );
    await expect(dndRegion(page)).toHaveText('');
  });

  test('rows 9 and 11: categories and the pool are read while a choice is carried', async ({
    page,
  }) => {
    await choice(page, PROBLEM).focus();
    await pressInTurn(page, ['Enter', 'Tab']);
    await expect(resultRegion(page)).toHaveText(
      /^Selected drop area for category .+\. Press ENTER to move selected answer choice identifies a problem and suggests a solution here or TAB to move to a different drop area\.$/
    );

    for (let i = 0; i < 2; i += 1) {
      await pressInTurn(page, ['Tab']);
    }
    await expect(resultRegion(page)).toHaveText(
      `Press ENTER to leave selected answer choice ${PROBLEM} unplaced or TAB to move to a category drop area.`
    );
  });

  test('rows 8 and 15: Esc ends the selection', async ({ page }) => {
    await choice(page, PROBLEM).focus();
    await pressInTurn(page, ['Enter', 'Escape']);
    await expect(resultRegion(page)).toHaveText(
      `Answer choice ${PROBLEM} is no longer selected. Use TAB to move to an answer choice.`
    );
    expect(await placed(page)).toEqual({});
  });

  test('rows 12, 6, 13, 10 and 14: place, name, move and remove', async ({ page }) => {
    // Row 12
    await choice(page, PROBLEM).focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect.poll(async () => Object.keys(await placed(page)).length).toBe(1);
    await expect
      .poll(
        async () => (await resultRegion(page).textContent()) + '|' + (await focusedName(page)),
        {
          timeout: 3000,
        }
      )
      .toMatch(
        /Placed answer choice identifies a problem and suggests a solution in drop area for category .+\./
      );
    const first = Object.keys(await placed(page))[0];

    // Row 6: the result stays in the landed tile's name until focus leaves it, so move away and back.
    await page.keyboard.press('Shift+Tab');
    const tile = choice(page, PROBLEM);
    await tile.focus();
    await expect(tile).toHaveAttribute(
      'aria-label',
      new RegExp(`^Answer choice: ${PROBLEM} in category .+$`)
    );

    // Row 13
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect.poll(async () => Object.keys(await placed(page))[0]).not.toBe(first);
    await expect
      .poll(
        async () => (await resultRegion(page).textContent()) + '|' + (await focusedName(page)),
        {
          timeout: 3000,
        }
      )
      .toMatch(
        /Moved answer choice identifies a problem and suggests a solution from drop area for category .+ to drop area for category .+\./
      );

    // Rows 10 and 14
    await choice(page, PROBLEM).focus();
    await pressInTurn(page, ['Enter']);
    for (let i = 0; i < 3; i += 1) {
      await pressInTurn(page, ['Tab']);
      if ((await resultRegion(page).textContent())?.startsWith('Press ENTER to remove')) break;
    }
    await expect(resultRegion(page)).toHaveText(
      /^Press ENTER to remove selected answer choice identifies a problem and suggests a solution from drop area for category .+ or TAB to move to a category drop area\.$/
    );
    await pressInTurn(page, ['Enter']);
    await expect.poll(async () => await placed(page)).toEqual({});
    await expect
      .poll(
        async () => (await resultRegion(page).textContent()) + '|' + (await focusedName(page)),
        {
          timeout: 3000,
        }
      )
      .toMatch(
        /Removed answer choice identifies a problem and suggests a solution from drop area for category .+\./
      );
  });

  test('row 3: a category lists what it holds, and the intro follows the answers', async ({
    page,
  }) => {
    await choice(page, PROBLEM).focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await choice(page, ARGUMENTS).focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect
      .poll(async () => (await introParagraphs(page))[2], { timeout: 3000 })
      .toBe(
        `Category 1 ${YES} contains 2 answer choices. answer choice ${PROBLEM} answer choice ${ARGUMENTS} End of answer choices.`
      );
  });

  // NVDA and JAWS turn ENTER into a click in browse mode, so the choice is selected by click and focus
  // then moves onto the categories and the pool for real: their names carry rows 9 to 11.
  test('rows 7, 9, 11, 8 and 12 on the click path a screen reader takes in browse mode', async ({
    page,
  }) => {
    await choice(page, PROBLEM).click();
    await expect(resultRegion(page)).toHaveText(
      `Selected answer choice ${PROBLEM}. Use TAB to move to a drop area.`
    );

    // Row 9: the pool sits above, so the first category is the next tab stop.
    await page.keyboard.press('Tab');
    await expect
      .poll(() => focusedName(page))
      .toBe(
        `Selected drop area for category ${YES}. Press ENTER to move selected answer choice ${PROBLEM} here or TAB to move to a different drop area.`
      );

    // Row 11: back to the pool, which the choice has not left.
    await page.keyboard.press('Shift+Tab');
    await expect
      .poll(() => focusedName(page))
      .toBe(
        `Press ENTER to leave selected answer choice ${PROBLEM} unplaced or TAB to move to a category drop area.`
      );

    // Row 8: ESC ends the selection, and the pool goes back to its own name.
    await page.keyboard.press('Escape');
    await expect(resultRegion(page)).toHaveText(
      `Answer choice ${PROBLEM} is no longer selected. Use TAB to move to an answer choice.`
    );
    await expect.poll(() => focusedName(page)).not.toContain('Press ENTER');
    expect(await placed(page)).toEqual({});

    // Row 12: select again, Tab to the first category and press ENTER there.
    await choice(page, PROBLEM).click();
    await pressInTurn(page, ['Tab', 'Enter']);
    await expect.poll(async () => Object.keys(await placed(page)).length).toBe(1);
    await expect(resultRegion(page)).toHaveText(
      `Placed answer choice ${PROBLEM} in drop area for category ${YES}.`
    );
  });

  test('the mouse path never speaks the keyboard instructions', async ({ page }) => {
    await choice(page, PROBLEM).click();
    await expect(resultRegion(page)).toContainText('Selected answer choice');
    await expect(resultRegion(page)).not.toContainText(
      'Press ENTER to move selected answer choice'
    );
    await expect(dndRegion(page)).toHaveText('');
  });
});

test.describe('categorize: screen reader announcements, categories in a matrix', () => {
  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, 'categorize', 'screen-reader-matrix');
    await expect(
      deliveryContainer(page)
        .getByRole('button', { name: /^Answer choice: / })
        .first()
    ).toBeVisible();
  });

  test('rows 1 and 3: the matrix, its labels and each cell', async ({ page }) => {
    const paragraphs = await introParagraphs(page);

    expect(paragraphs[0]).toBe(
      'The question has 6 categories, arranged in a 2 by 3 matrix. Each category can hold 1 answer choice.'
    );
    expect(paragraphs[1]).toBe('The column labels are: Column 1: Volume Column 2: Pitch');
    expect(paragraphs[2]).toBe(
      'The row labels are: Row 1: Range Row 2: Unit of Measure Row 3: What is Measured'
    );
    expect(paragraphs[3]).toBe('There are 6 answer choices, which cannot be reused.');
    expect(paragraphs[5]).toBe('The category in row Range and column Volume is empty.');
    expect(paragraphs[10]).toBe('The category in row What is Measured and column Pitch is empty.');
  });

  test('rows 6, 9, 12 and 3: a choice is placed in a cell and the cell reads it', async ({
    page,
  }) => {
    await choice(page, 'soft to loud').focus();
    await pressInTurn(page, ['Enter', 'Tab']);
    await expect(resultRegion(page)).toHaveText(
      'Selected drop area for category in row Range and column Volume. Press ENTER to move selected answer choice soft to loud here or TAB to move to a different drop area.'
    );
    await pressInTurn(page, ['Enter']);
    await expect
      .poll(
        async () => (await resultRegion(page).textContent()) + '|' + (await focusedName(page)),
        {
          timeout: 3000,
        }
      )
      .toMatch(
        /Placed answer choice soft to loud in drop area for category in row Range and column Volume\./
      );
    await expect
      .poll(async () => (await introParagraphs(page))[5])
      .toBe('The category in row Range and column Volume contains answer choice soft to loud.');
    // Row 6, once focus has left the tile that carried the result.
    await page.keyboard.press('Shift+Tab');
    await expect(choice(page, 'soft to loud')).toHaveAttribute(
      'aria-label',
      'Answer choice: soft to loud in category in row Range and column Volume'
    );
  });

  test('row 12: a cell that holds a choice gives it up for the next one', async ({ page }) => {
    await choice(page, 'soft to loud').focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await choice(page, 'low to high').focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect
      .poll(
        async () => (await resultRegion(page).textContent()) + '|' + (await focusedName(page)),
        {
          timeout: 3000,
        }
      )
      .toMatch(
        /Placed answer choice low to high in drop area for category in row Range and column Volume\. To make room for it, answer choice soft to loud was removed\./
      );
  });
});

// A reusable choice stays in the pool when it is placed, so the tile the drag started from is still there.
// Focus must still go to the tile that landed, which carries the result in its name until focus leaves it.
test.describe('categorize: screen reader announcements, reusable choices', () => {
  test('row 12: focus goes to the tile that landed, and the result leaves its name with focus', async ({
    page,
  }) => {
    await openDeliverRoute(page, 'categorize', 'calculus-concepts');
    const tile = deliveryContainer(page).locator('[role="button"][tabindex="0"]').first();
    await expect(tile).toBeVisible();

    await tile.focus();
    await pressInTurn(page, ['Enter', 'Tab', 'Enter']);
    await expect.poll(async () => Object.keys(await placed(page)).length).toBe(1);

    const landed = () =>
      page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return {
          inCategory: !!el?.closest('[data-category-id]'),
          name: el?.getAttribute('aria-label') ?? '',
        };
      });

    await expect.poll(landed).toEqual({
      inCategory: true,
      name: expect.stringMatching(
        /^Placed answer choice .+ in drop area for category .+\. Answer choice: /
      ),
    });

    await page.keyboard.press('Shift+Tab');
    const placedTile = deliveryContainer(page)
      .locator('[data-category-id] [role="button"]')
      .first();
    await expect(placedTile).not.toHaveAttribute('aria-label', /^Placed/);
  });
});
