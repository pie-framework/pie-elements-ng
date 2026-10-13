import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EXPLORER_CSS,
  EXPLORER_STYLESHEET_ID,
  injectExplorerStyles,
} from '../src/explorer-styles.js';

const MATHJAX_LOADING = Symbol.for('@pie-element/shared-math-rendering-mathjax/loading');
const page = window as any;

const explorerSheets = () => document.querySelectorAll(`style#${EXPLORER_STYLESHEET_ID}`);

// The declarations of the rule with exactly this selector list.
const declarations = (selectors: string) => {
  const rule = EXPLORER_CSS.split('}').find((r) => r.split('{')[0].trim() === selectors);
  return rule?.split('{')[1].trim();
};

const FOCUS =
  'var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0)))';
const TINT = `color-mix(in srgb, ${FOCUS} 15%, transparent)`;

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  document.body.innerHTML = '';
  for (const style of document.head.querySelectorAll('style')) style.remove();
  delete page.MathJax;
  delete (globalThis as any)[MATHJAX_LOADING];
});

describe('MathJax explorer theme stylesheet', () => {
  it('is added to <head> once however often it is injected', () => {
    injectExplorerStyles();
    injectExplorerStyles();

    expect(explorerSheets()).toHaveLength(1);
    expect(explorerSheets()[0].parentNode).toBe(document.head);
    expect(explorerSheets()[0].textContent).toBe(EXPLORER_CSS);
  });

  // MathJax 4.1.3's LiveRegion and explorer selectors, each one pseudo-class below the override.
  it.each([
    [
      'mjx-container [data-sre-highlight-1]:not([data-mjx-collapsed], rect)',
      `color: var(--pie-text, black) !important;\n  fill: var(--pie-text, black) !important;`,
    ],
    [
      'mjx-container:not([data-mjx-clone-container]) [data-sre-highlight-1]:not([data-sre-enclosed], rect)',
      `background-color: ${TINT} !important;`,
    ],
    [
      'mjx-container rect[data-sre-highlight-1]:not([data-sre-enclosed])',
      `fill: ${TINT} !important;`,
    ],
    ['mjx-container .mjx-selected', `outline: 2px solid ${FOCUS} !important;`],
  ])('themes %s under :root', (selector, expected) => {
    expect(declarations(`:root ${selector}`)).toBe(expected);
  });

  it('themes the secondary highlight with the scheme text and a dashed focus outline', () => {
    expect(declarations(':root mjx-container [data-sre-highlight-2]')).toContain(
      `outline: 2px dashed ${FOCUS} !important;`
    );
    expect(declarations(':root mjx-container rect[data-sre-highlight-2]')).toContain(
      `stroke: ${FOCUS} !important;`
    );
  });

  it('paints the speech, braille, magnifier and tooltip regions in the scheme colours', () => {
    expect(declarations(':root .MJX_LiveRegion, :root .MJX_HoverRegion, :root .MJX_ToolTip')).toBe(
      'color: var(--pie-text, black) !important;\n' +
        '  background-color: var(--pie-background, #ffffff) !important;\n' +
        '  border-color: var(--pie-border-dark, #66686A) !important;'
    );
    expect(declarations(':root .MJX_LiveRegion > div, :root .MJX_HoverRegion > div')).toContain(
      'color: var(--pie-text, black) !important;'
    );
  });

  it('is added by the first render that typesets, once across copies of the adapter', async () => {
    page.MathJax = {
      version: '4.1.3',
      startup: { promise: Promise.resolve() },
      typesetPromise: vi.fn(async () => {}),
    };
    const element = (html: string) => {
      const el = document.createElement('div');
      el.innerHTML = html;
      document.body.append(el);
      return el;
    };
    const first = await import('../src/adapter.js');
    vi.resetModules();
    const second = await import('../src/adapter.js');
    expect(second).not.toBe(first);

    await first.createMathjaxRenderer()(element('plain text'));
    expect(explorerSheets()).toHaveLength(0);

    await first.createMathjaxRenderer()(element('\\(x\\)'));
    await second.createMathjaxRenderer()(element('\\(y\\)'));
    expect(explorerSheets()).toHaveLength(1);
  });
});
