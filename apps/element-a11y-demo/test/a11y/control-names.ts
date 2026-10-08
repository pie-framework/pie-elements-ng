import type { Page } from '@playwright/test';

const probeAttribute = 'data-a11y-name-probe';

/**
 * The visible interactive controls under `subjectSelector` that Chrome gives no accessible name,
 * as the first 300 characters of their HTML, at most `limit` of them.
 *
 * The name is read from Chrome's accessibility tree, so every source the accessible-name
 * computation allows counts, an image's `alt` inside the control among them. A control is
 * skipped when it, or an element around it, is `aria-hidden` or `inert`: it is outside the
 * accessibility tree, as MUI Select's native input is.
 */
export async function findUnnamedControls(
  page: Page,
  subjectSelector: string,
  limit = 10
): Promise<string[]> {
  const subject = page.locator(subjectSelector);
  const controls = await subject.evaluate((root, probe) => {
    const interactiveSelector = [
      'button',
      'input',
      'select',
      'textarea',
      'summary',
      'a[href]',
      '[role="button"]',
      '[role="checkbox"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="radio"]',
      '[role="slider"]',
      '[role="switch"]',
      '[role="tab"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    function isVisible(element: Element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    }

    function isExposed(element: Element) {
      return !element.closest('[aria-hidden="true"], [inert]');
    }

    // The probe attribute lets the accessibility-tree lookup find each control; the HTML is
    // taken before it is set, so the report shows the element's own markup.
    return [...root.querySelectorAll(interactiveSelector)]
      .filter(isExposed)
      .filter(isVisible)
      .map((element, index) => {
        const html = element.outerHTML.slice(0, 300);
        element.setAttribute(probe, String(index));
        return html;
      });
  }, probeAttribute);

  if (controls.length === 0) {
    return [];
  }

  const cdp = await page.context().newCDPSession(page);
  try {
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    const unnamed: string[] = [];

    for (const [index, html] of controls.entries()) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `[${probeAttribute}="${index}"]`,
      });
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', {
        nodeId,
        fetchRelatives: false,
      });
      const name = nodes[0]?.name?.value;

      if (typeof name !== 'string' || !name.trim()) {
        unnamed.push(html);
      }
    }

    return unnamed.slice(0, limit);
  } finally {
    await cdp.detach();
    await subject.evaluate((root, probe) => {
      for (const element of root.querySelectorAll(`[${probe}]`)) {
        element.removeAttribute(probe);
      }
    }, probeAttribute);
  }
}
