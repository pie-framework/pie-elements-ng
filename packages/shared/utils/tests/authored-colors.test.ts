// @vitest-environment jsdom
// DOMPurify needs jsdom here; vitest.setup.ts says why.
import { describe, expect, it } from 'vitest';
import {
  AUTHORED_BORDER_ATTR,
  AUTHORED_FILL_ATTR,
  AUTHORED_INK_ATTR,
  classifyAuthoredFill,
  parseCssColor,
} from '../src/authored-colors';
import { sanitizeModelHtml } from '../src/sanitize-model-html';

// The sanitized element `selector` matches, or the first one.
const first = (html: string, selector = '*') => {
  const template = document.createElement('template');
  template.innerHTML = sanitizeModelHtml(html);
  return template.content.querySelector(selector) as HTMLElement;
};

const table = (row: string) => `<table><tbody>${row}</tbody></table>`;

const markers = (el: Element | null) => ({
  ink: el?.hasAttribute(AUTHORED_INK_ATTR) ?? false,
  fill: el?.getAttribute(AUTHORED_FILL_ATTR) ?? null,
  border: el?.hasAttribute(AUTHORED_BORDER_ATTR) ?? false,
});

describe('parseCssColor', () => {
  // Chromium's rendering of each color, read back from a canvas. Out-of-gamut colors are left
  // out: Chromium gamut-maps them and this parser clips, which classification does not notice.
  it.each([
    ['#ddd', [221, 221, 221, 1]],
    ['#DDDDDD', [221, 221, 221, 1]],
    ['#abcdef80', [171, 205, 239, 0.502]],
    ['#0f08', [0, 255, 0, 0.533]],
    ['rgb(221, 221, 221)', [221, 221, 221, 1]],
    ['rgba(255, 255, 0, 0.5)', [255, 255, 0, 0.5]],
    ['rgb(255 255 0 / 50%)', [255, 255, 0, 0.5]],
    ['rgb(100% 50% 0%)', [255, 128, 0, 1]],
    ['rgb(none 0 0)', [0, 0, 0, 1]],
    ['rgba(0, 0, 0, 0)', [0, 0, 0, 0]],
    ['transparent', [0, 0, 0, 0]],
    ['hsl(120, 100%, 25%)', [0, 128, 0, 1]],
    ['hsla(0, 0%, 0%, 5%)', [0, 0, 0, 0.05]],
    ['hsl(210deg 40% 90% / 0.8)', [219, 230, 240, 0.8]],
    ['hsl(0.5turn 60% 40%)', [41, 163, 163, 1]],
    ['hwb(200 20% 30%)', [51, 136, 179, 1]],
    ['lab(100 0 0)', [255, 255, 255, 1]],
    ['lab(50 40 -30)', [165, 91, 171, 1]],
    ['lab(80% 0 0)', [198, 198, 198, 1]],
    ['lch(70 40 120)', [151, 181, 106, 1]],
    ['lch(70 40 120 / 50%)', [151, 181, 106, 0.5]],
    ['oklab(0.9 0.02 -0.05)', [222, 216, 255, 1]],
    ['oklch(0.7 0.1 200)', [64, 177, 183, 1]],
    ['oklch(95% 0.03 90)', [246, 238, 216, 1]],
    ['LightGrey', [211, 211, 211, 1]],
    ['rebeccapurple', [102, 51, 153, 1]],
  ])('reads %s as Chromium renders it', (value, [r, g, b, a]) => {
    const c = parseCssColor(value);

    expect(c).not.toBeNull();
    expect(Math.abs((c?.r ?? -9) - r)).toBeLessThanOrEqual(1);
    expect(Math.abs((c?.g ?? -9) - g)).toBeLessThanOrEqual(1);
    expect(Math.abs((c?.b ?? -9) - b)).toBeLessThanOrEqual(1);
    expect(c?.a).toBeCloseTo(a, 2);
  });

  it.each([
    'var(--pie-text)',
    'rgb(calc(1 + 1) 0 0)',
    'color(display-p3 1 0 0)',
    'color-mix(in srgb, red, blue)',
    'canvastext',
    'rgb(1 2)',
    'hsl(10% 50% 50%)',
    '#ccccc',
    'reddish',
  ])('returns null for %s', (value) => {
    expect(parseCssColor(value)).toBeNull();
  });
});

describe('classifyAuthoredFill', () => {
  it.each([
    ['#ffffff', 'light'],
    ['#eee', 'light'],
    ['whitesmoke', 'light'],
    ['rgba(0, 0, 0, 0.05)', 'light'],
    ['lab(100 0 0)', 'light'],
    ['rgb(221, 221, 221)', 'shade'],
    ['lightgrey', 'shade'],
    ['yellow', 'shade'],
    ['#fffde7', 'shade'],
    ['color-mix(in srgb, red, blue)', 'shade'],
  ])('classifies %s as %s', (value, expected) => {
    expect(classifyAuthoredFill(value)).toBe(expected);
  });
});

describe('authored color markers', () => {
  it.each([
    [
      'a header fill',
      table('<tr><th style="background-color: rgb(221, 221, 221);">h</th></tr>'),
      'shade',
    ],
    ['a highlight', table('<tr><td style="background-color: yellow;">.9948</td></tr>'), 'shade'],
    ['a row bgcolor', table('<tr bgcolor="lightgrey"><td>x</td></tr>'), 'shade'],
    ['a shorthand fill', '<div style="background: #eee url(x.png) no-repeat;">x</div>', 'light'],
    ['a Lab fill', '<div style="background-color: lab(100 0 0);">x</div>', 'light'],
    ['a bgcolor', '<div bgcolor="lightgrey">x</div>', 'shade'],
    ['a bgcolor without a hash', '<div bgcolor="ddd">x</div>', 'shade'],
  ])('classifies %s', (_, html, fill) => {
    expect(markers(first(html, `[${AUTHORED_FILL_ATTR}]`)).fill).toBe(fill);
  });

  it('marks the ink and fill of pasted text', () => {
    const span = first(
      '<span style="background-color: rgb(255, 255, 255); color: rgb(81, 82, 84); font-size: 12px;">x</span>'
    );

    expect(markers(span)).toEqual({ ink: true, fill: 'light', border: false });
  });

  it('marks a font color as ink', () => {
    expect(markers(first('<font color="#c00">x</font>'))).toEqual({
      ink: true,
      fill: null,
      border: false,
    });
  });

  it('marks a border with an authored color', () => {
    const td = first(
      table(
        '<tr><td style="width: 15px; background-color: gray; border: solid 1px black;">x</td></tr>'
      ),
      'td'
    );

    expect(markers(td)).toEqual({ ink: false, fill: 'shade', border: true });
  });

  it.each([
    ['transparent', '<span style="background-color: transparent;">x</span>'],
    ['zero alpha', '<span style="background-color: rgba(0, 0, 0, 0);">x</span>'],
    [
      'a token',
      '<span style="color: var(--pie-text); background: var(--pie-background);">x</span>',
    ],
    ['inherit', '<span style="color: inherit;">x</span>'],
    ['currentcolor', '<span style="border: 1px solid;">x</span>'],
    [
      'a style that overrides the bgcolor',
      '<div bgcolor="gray" style="background-color: transparent;">x</div>',
    ],
    ['a style that overrides the font color', '<font color="red" style="color: inherit;">x</font>'],
    ['a color attribute outside <font>', '<span color="red">x</span>'],
    ['no color at all', '<span style="font-weight: bold;">x</span>'],
  ])('leaves %s unmarked', (_, html) => {
    expect(markers(first(html))).toEqual({ ink: false, fill: null, border: false });
  });

  it('marks SVG and passes MathML through where the DOM gives it no style', () => {
    const html =
      '<svg><text style="color: red;">x</text></svg><math style="color: red;"><mi>x</mi></math>';

    expect(markers(first(html, 'text')).ink).toBe(true);
    expect(first(html, 'mi')).not.toBeNull();
  });

  it('drops !important from marked declarations and keeps it elsewhere', () => {
    const span = first(
      '<span style="color: red !important; background-color: navy !important; font-weight: bold !important;">x</span>'
    );

    expect(span.style.getPropertyPriority('color')).toBe('');
    expect(span.style.getPropertyPriority('background-color')).toBe('');
    expect(span.style.getPropertyValue('color')).toBe('red');
    expect(span.style.getPropertyPriority('font-weight')).toBe('important');
  });

  it('recomputes markers the author wrote', () => {
    const span = first(
      `<span ${AUTHORED_FILL_ATTR}="light" ${AUTHORED_BORDER_ATTR} style="background-color: navy;">x</span>`
    );

    expect(markers(span)).toEqual({ ink: false, fill: 'shade', border: false });
  });

  it('leaves the style attribute as written when nothing is important', () => {
    const html = '<p style="color:#333;font-size:12px">x</p>';

    expect(sanitizeModelHtml(html)).toBe(
      `<p style="color:#333;font-size:12px" ${AUTHORED_INK_ATTR}="">x</p>`
    );
  });
});
