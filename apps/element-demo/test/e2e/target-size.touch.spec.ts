import { expect, test, type Page } from '@playwright/test';
import { ELEMENT_REGISTRY } from '../../src/lib/elements/registry';
import { deliveryContainer, openDeliverRoute, waitForMathRendering } from './test-helpers';
import { assertTouchEnabled } from './touch-helpers';

/**
 * Is every control a finger has to hit big enough to hit?
 *
 * WCAG 2.2 SC 2.5.8 (Target Size, Minimum, AA) asks for 24x24 CSS pixels, with
 * four exceptions. This spec measures every tappable control in each element's
 * default delivery view at the touch viewport and reports the ones that fall
 * short, honouring the exceptions that can be decided from the DOM:
 *
 * - spacing: a target under 24px passes if a 24px circle centred on it touches
 *   no other target;
 * - sr-only: a control clipped to 1x1px is for assistive technology, not a finger
 *   (hotspot's per-shape buttons over its canvas);
 * - inline: a link inside a run of text is sized by the text;
 * - equivalent: not measurable here, so none is assumed - a short control whose
 *   function is available through a larger one is recorded in SHORTFALLS.
 *
 * A checkbox or radio is measured as the larger of the input and the label
 * around it, because the label is what a finger lands on.
 *
 * SHORTFALLS is the record: each element that falls short names the ticket that
 * fixes it, or the exception that excuses it. A new shortfall, or a listed one
 * that no longer falls short, fails the spec.
 */

const MIN = 24;

type Shortfall = { control: string; width: number; height: number };
type Measured = { count: number; short: Shortfall[] };

type Recorded = { ticket?: string; exception?: string; controls: string[] };

/** Elements known to fall short; see the header. Keyed by element name. */
const SHORTFALLS: Record<string, Recorded> = {};

/** Elements whose delivery view has nothing to tap. */
const SKIPPED: Record<string, string> = {
  rubric: 'display only: the delivery view has no control to tap',
  'complex-rubric': 'display only: the delivery view has no control to tap',
};

async function measure(page: Page): Promise<Measured> {
  return deliveryContainer(page).evaluate((container, min) => {
    type Box = { el: Element; x: number; y: number; w: number; h: number };
    const SELECTOR = [
      'button',
      'a[href]',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'summary',
      'canvas',
      '[contenteditable="true"]',
      'math-field',
      '[role="button"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="switch"]',
      '[role="tab"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="slider"]',
      '[role="link"]',
      '[tabindex]:not([tabindex^="-"])',
    ].join(',');

    // Collects matches through open shadow roots, which querySelectorAll does not cross. A
    // math-field is the tap target itself: its shadow root holds MathLive's zero-size keyboard
    // sink, which is never tapped.
    const collect = (root: ParentNode, into: Element[]) => {
      for (const el of Array.from(root.querySelectorAll(SELECTOR))) {
        into.push(el);
      }
      for (const host of Array.from(root.querySelectorAll('*'))) {
        if (host.shadowRoot && host.tagName !== 'MATH-FIELD') {
          collect(host.shadowRoot, into);
        }
      }
    };

    const visible = (el: Element) => {
      for (
        let n: Element | null = el;
        n;
        n = n.parentElement ?? (n.getRootNode() as ShadowRoot).host
      ) {
        const style = getComputedStyle(n);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
      }
      return true;
    };

    const rectOf = (el: Element): Box => {
      let r = el.getBoundingClientRect();
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        for (const label of Array.from(el.labels ?? [])) {
          const lr = label.getBoundingClientRect();
          if (lr.width * lr.height > r.width * r.height) r = lr;
        }
      }
      return { el, x: r.x, y: r.y, w: r.width, h: r.height };
    };

    const isInlineLink = (el: Element) => {
      if (el.tagName !== 'A') return false;
      const parent = el.parentElement;
      const own = (el.textContent ?? '').trim();
      return Boolean(parent && (parent.textContent ?? '').trim().length > own.length + 10);
    };

    const found: Element[] = [];
    collect(container, found);
    const boxes = Array.from(new Set(found))
      .filter((el) => visible(el) && !(el as HTMLButtonElement).disabled)
      .map(rectOf)
      .filter((b) => b.w > 1 || b.h > 1);

    const describe = (el: Element) => {
      const name =
        el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 30) ?? '';
      const role = el.getAttribute('role') ?? (el as HTMLInputElement).type ?? '';
      return `${el.tagName.toLowerCase()}${role ? `[${role}]` : ''}${name ? ` "${name}"` : ''}`;
    };

    // Does a 24px circle centred on `a` reach any other target?
    const crowded = (a: Box) => {
      const cx = a.x + a.w / 2;
      const cy = a.y + a.h / 2;
      const r = min / 2;
      return boxes.some((b) => {
        if (b === a || a.el.contains(b.el) || b.el.contains(a.el)) return false;
        const nx = Math.max(b.x, Math.min(cx, b.x + b.w));
        const ny = Math.max(b.y, Math.min(cy, b.y + b.h));
        return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
      });
    };

    const short = boxes
      .filter((b) => (b.w < min || b.h < min) && !isInlineLink(b.el) && crowded(b))
      .map((b) => ({
        control: describe(b.el),
        width: Math.round(b.w * 10) / 10,
        height: Math.round(b.h * 10) / 10,
      }));
    return { count: boxes.length, short };
  }, MIN);
}

test.describe('tappable controls are at least 24x24 CSS pixels', () => {
  for (const { name } of ELEMENT_REGISTRY) {
    test(`${name}: delivery`, async ({ page }) => {
      test.skip(name in SKIPPED, SKIPPED[name] ?? '');
      await openDeliverRoute(page, name);
      await assertTouchEnabled(page);
      await expect(deliveryContainer(page)).toBeVisible();
      await waitForMathRendering(page);

      // Some views draw their controls after the container is visible.
      await expect
        .poll(async () => (await measure(page)).count, {
          message: 'no tappable control found, so nothing was measured',
        })
        .toBeGreaterThan(0);
      const { count, short } = await measure(page);
      test.info().annotations.push({ type: 'measured', description: `${count} controls` });
      const report = short.map((s) => `${s.control} ${s.width}x${s.height}`);
      const recorded = SHORTFALLS[name];

      if (recorded) {
        test.info().annotations.push({
          type: recorded.ticket ? 'ticket' : 'exception',
          description: `${recorded.ticket ?? recorded.exception}: ${recorded.controls.join('; ')}`,
        });
        expect(report, 'a recorded shortfall changed; update SHORTFALLS').toEqual(
          recorded.controls
        );
      } else {
        expect(report, `controls under ${MIN}x${MIN} CSS px`).toEqual([]);
      }
    });
  }
});
