import type { Page } from '@playwright/test';

const settledScanRoot =
  '[data-testid="a11y-scan-root"]:is([data-a11y-ready="true"], [data-a11y-render="not-rendered"])';

/**
 * Waits until the scan route has rendered the element's delivery DOM. Throws when it rendered
 * nothing to scan, so the record reports the scan as not rendered.
 */
export async function waitForRenderedScanSubject(page: Page, timeout = 30_000): Promise<void> {
  const root = await page.waitForSelector(settledScanRoot, { timeout });
  if ((await root.getAttribute('data-a11y-render')) === 'not-rendered') {
    throw new Error(
      (await root.getAttribute('data-a11y-render-issue')) ??
        'Not rendered: the element rendered nothing to scan.'
    );
  }
}
