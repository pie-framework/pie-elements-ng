import { describe, expect, it } from 'vitest';
import {
  defaults,
  editorToolbar,
  keypadButton,
  keypadButtonHover,
  keypadButtonOperator,
  keypadButtonOperatorHover,
  keypadInk,
} from '../src/color';
import { channels, contrast, type RGB } from './contrast';

// What the browser paints for the helper's color-mix over a given --pie-background.
const mixOver = (css: string, background: RGB): RGB => {
  const [, hue, share] = /color-mix\(in srgb, rgb\(([\d. ]+)\) ([\d.]+)%/.exec(css)!;
  const p = Number(share) / 100;
  return hue.split(' ').map((c, i) => Math.round(Number(c) * p + background[i] * (1 - p)));
};

// What the browser paints for keypadInk() from a given --pie-text.
const shadeInk = (css: string, ink: RGB): RGB => {
  const [, floor, sum] = /clamp\(([\d.]+), \(r \+ g \+ b\) \/ (\d+), 1\)/.exec(css)!;
  const f = Math.min(1, Math.max(Number(floor), (ink[0] + ink[1] + ink[2]) / Number(sum)));
  return ink.map((c) => Math.round(c * f));
};

const WHITE = [255, 255, 255];
// The dark preset's --pie-background and --pie-text.
const DARK_BACKGROUND = [26, 32, 44];
const DARK_INK = [226, 232, 240];

const fills = [
  ['keypad key', keypadButton, defaults.KEYPAD_BUTTON],
  ['keypad operator', keypadButtonOperator, defaults.KEYPAD_BUTTON_OPERATOR],
  ['keypad key hover', keypadButtonHover, defaults.KEYPAD_BUTTON_HOVER],
  ['keypad operator hover', keypadButtonOperatorHover, defaults.KEYPAD_BUTTON_OPERATOR_HOVER],
  ['editor toolbar', editorToolbar, defaults.EDITOR_TOOLBAR],
] as const;

describe('fills mixed into the scheme background', () => {
  it.each(fills)('%s reads --pie-background and falls back to white', (_, fill) => {
    expect(fill()).toContain('var(--pie-background, #ffffff))');
  });

  it.each(fills)('%s renders its authored literal over white', (_, fill, literal) => {
    expect(mixOver(fill(), WHITE)).toEqual(channels(literal));
  });

  it.each(fills.slice(0, 4))('%s keeps the dark preset ink at 4.5:1 or more', (_, fill) => {
    expect(contrast(DARK_INK, mixOver(fill(), DARK_BACKGROUND))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps the editor toolbar's grey icons at 3:1 or more under the dark preset", () => {
    expect(contrast([128, 128, 128], mixOver(editorToolbar(), DARK_BACKGROUND))).toBeGreaterThanOrEqual(3);
  });

  // The editable-html-tip-tap and math-toolbar Done checks, on the toolbar fill and the Correct Answer card.
  it.each([
    ['the light preset', [46, 125, 50], WHITE],
    ['the dark preset', [102, 187, 106], DARK_BACKGROUND],
    ['no theme', channels(defaults.CORRECT_WITH_ICON), WHITE],
  ])('keeps the correct-icon Done check at 3:1 or more under %s', (_, check, background) => {
    expect(contrast(check, mixOver(editorToolbar(), background))).toBeGreaterThanOrEqual(3);
    expect(contrast(check, background)).toBeGreaterThanOrEqual(3);
  });

  it('keeps operator keys a distinct hue from number keys under the dark preset', () => {
    const [key, operator] = [keypadButton, keypadButtonOperator].map((f) => mixOver(f(), DARK_BACKGROUND));
    expect(operator[0] - operator[2]).toBeGreaterThan(0);
    expect(key[2] - key[0]).toBeGreaterThan(0);
  });

  it('lets a host keypad token win over the mix', () => {
    expect(keypadButton()).toMatch(/^var\(--pie-keypad-button, color-mix\(/);
    expect(keypadButtonHover()).toMatch(/^var\(--pie-keypad-button-hover, color-mix\(/);
  });
});

// pie-players schemes whose ink sits close to the key fills, plus the extremes.
const schemes = [
  ['no theme', [0, 0, 0], WHITE],
  ['grey-on-light-grey', [74, 74, 74], [235, 235, 235]],
  ['purple-on-light-green', [142, 36, 100], [204, 232, 212]],
  ['light-gray-on-dark-gray', [224, 224, 224], [51, 51, 51]],
  ['yellow-on-navy', [255, 255, 85], [51, 80, 138]],
  ['the dark preset', DARK_INK, DARK_BACKGROUND],
] as const;

describe('keypad key ink', () => {
  it('reads --pie-text', () => {
    expect(keypadInk()).toMatch(/^rgb\(from var\(--pie-text, black\) /);
  });

  it.each(schemes)('keeps key labels at 4.5:1 or more on every key fill under %s', (_, text, background) => {
    const ink = shadeInk(keypadInk(), [...text]);
    for (const [, fill] of fills.slice(0, 4)) {
      expect(contrast(ink, mixOver(fill(), [...background]))).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(schemes.slice(3))('passes the %s ink unchanged', (_, text) => {
    expect(shadeInk(keypadInk(), [...text])).toEqual([...text]);
  });
});
