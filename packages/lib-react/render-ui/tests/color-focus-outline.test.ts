import { describe, expect, it } from 'vitest';
import { defaults, focusOutline, keyBoardFocusIndicator } from '../src/color';

const luminance = (hex: string) => {
  const [r, g, b] = hex
    .slice(1)
    .match(/../g)!
    .map((h) => {
      const s = parseInt(h, 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

describe('focus ring colour', () => {
  it('chains the THEMING.md focus tokens', () => {
    expect(focusOutline()).toBe(
      'var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0)))',
    );
  });

  it('falls back to a colour at 3:1 or more on white', () => {
    expect(1.05 / (luminance(defaults.FOCUS_CHECKED_BORDER) + 0.05)).toBeGreaterThanOrEqual(3);
  });

  it('serves the keyboard focus indicator from the same chain', () => {
    expect(keyBoardFocusIndicator()).toBe(focusOutline());
  });
});
