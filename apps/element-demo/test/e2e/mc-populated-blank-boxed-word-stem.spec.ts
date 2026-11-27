import { test, expect } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  switchTab,
  updateModelInSource,
} from './test-helpers';

// The stem of star item 8431d06a-0c7e-4f4e-888b-d1068a3024bb: a word box drawn as a bordered table,
// in a group with the newlines its author left around the table, then the blank.
const BOXED_WORD_TEMPLATE =
  '<p></p><div aria-label="box" role="group">\n<table role="presentation" style="width:150px; height:150px; border: 4px solid black;">\n\t<tbody>\n\t\t<tr>\n\t\t\t<td style="vertical-align:middle; text-align: center; padding-top:25px; padding-right:20px; padding-left:20px; line-height:2.8em;"><span style="font-size:1.8em;">ear</span></td>\n\t\t</tr>\n\t</tbody>\n</table>\n</div> {{blank}} <p></p>';

// From 850px the r1 stem is one row: the box keeps its authored 150px size, no empty line opens
// above it, and the blank sits beside it, top-aligned, in line with it as in Learnosity.
test('mc-populated-blank: a word box and the blank share one line in an r1 token stem', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/mc-populated-blank/source?demo=variant-sel-r1-g-stem');
  await page.locator('[data-testid="source-editor"]').waitFor({ timeout: 60_000 });
  await updateModelInSource(page, {
    ...(await getModelFromSource(page)),
    template: BOXED_WORD_TEMPLATE,
  });
  await switchTab(page, 'deliver');
  const line = deliveryContainer(page).locator('.pie-template-line');
  await expect(line.locator('table')).toBeVisible();

  const rect = async (selector: string) => {
    const bounds = await line.locator(selector).boundingBox();
    if (!bounds) {
      throw new Error(`No bounding box for ${selector}`);
    }
    return {
      top: bounds.y,
      left: bounds.x,
      right: bounds.x + bounds.width,
      bottom: bounds.y + bounds.height,
    };
  };
  const group = await rect('[role="group"]');
  const box = await rect('table');
  const blank = await rect('.pie-blank-slot');

  expect(box.right - box.left).toBeCloseTo(150, 0);
  expect(box.bottom - box.top).toBeCloseTo(150, 0);
  expect(box.top).toBeCloseTo(group.top, 0);
  expect(blank.left).toBeGreaterThanOrEqual(box.right);
  expect(blank.top).toBeCloseTo(box.top, 0);
});
