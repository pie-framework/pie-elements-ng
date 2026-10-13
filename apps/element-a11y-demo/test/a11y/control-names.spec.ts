import { expect, type Page, test } from '@playwright/test';
import { findUnnamedControls } from './control-names';

const subjectSelector = '[data-testid="a11y-scan-subject"]';
const pixel = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

/** drag-in-the-blank's choice: a draggable span around a MUI Chip whose label is the choice HTML. */
function imageChoice(alt: string) {
  return `<span role="button" tabindex="0" aria-roledescription="draggable"><div class="MuiChip-root"><span class="MuiChip-label"><span><img alt="${alt}" src="${pixel}" width="40" height="20"></span></span></div></span>`;
}

async function unnamedControls(page: Page, html: string) {
  await page.setContent(`<div data-testid="a11y-scan-subject">${html}</div>`);
  return findUnnamedControls(page, subjectSelector);
}

test.describe('interactive-control-name', () => {
  test('names a control from the alt of an image in its content', async ({ page }) => {
    expect(await unnamedControls(page, imageChoice('3x8 array'))).toEqual([]);
  });

  test('reports a control whose only content is an image with an empty alt', async ({ page }) => {
    const unnamed = await unnamedControls(page, imageChoice(''));

    expect(unnamed).toHaveLength(1);
    expect(unnamed[0]).toContain('aria-roledescription="draggable"');
  });

  test('reports a button whose only text is aria-hidden', async ({ page }) => {
    expect(
      await unnamedControls(
        page,
        '<button type="button"><span aria-hidden="true">×</span></button>'
      )
    ).toHaveLength(1);
  });

  test('reports a focusable element with no role, whatever text it holds', async ({ page }) => {
    expect(await unnamedControls(page, '<div tabindex="0">Enter an answer</div>')).toHaveLength(1);
  });

  test('names controls from aria-label, aria-labelledby, a label and title', async ({ page }) => {
    const html = [
      '<button type="button" aria-label="Close"></button>',
      '<span id="blank-name">Blank 1</span><span role="button" tabindex="0" aria-labelledby="blank-name"></span>',
      '<label>Answer <input type="text"></label>',
      '<button type="button" title="Delete"></button>',
    ].join('');

    expect(await unnamedControls(page, html)).toEqual([]);
  });

  test('skips aria-hidden and inert controls and leaves no probe attribute', async ({ page }) => {
    const html = [
      '<div aria-hidden="true"><input type="text"></div>',
      '<div inert><button type="button"></button></div>',
      '<button type="button">Check</button>',
    ].join('');

    expect(await unnamedControls(page, html)).toEqual([]);
    await expect(page.locator('[data-a11y-name-probe]')).toHaveCount(0);
  });
});
