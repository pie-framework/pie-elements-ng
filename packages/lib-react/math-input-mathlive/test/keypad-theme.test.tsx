import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { color } from '@pie-lib/render-ui';
import { KeyPad } from '../src/keypad/index';
import { overline } from '../src/keys/geometry';

const FOCUS_RING =
  'var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0)))';

// The rules emotion emits for an element's own class, in source order.
const rulesFor = (el: Element) => {
  const classes = [...el.classList].filter((c) => c.startsWith('css-'));
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  return css.split('}').filter((r) => classes.some((c) => r.includes(`.${c}`)));
};

const renderKeypad = () =>
  render(<KeyPad onPress={() => {}} additionalKeys={[[{ ...overline, name: 'Overline' }]]} />);

describe('keypad keys', () => {
  it.each([
    ['a label key', () => screen.getByRole('button', { name: 'seven' })],
    ['a LaTeX key', () => screen.getByRole('button', { name: 'Overline' })],
  ])('outline %s on keyboard focus with the focus chain over a background ring', (_, key) => {
    renderKeypad();
    const focus = rulesFor(key()).filter((r) => r.includes('.Mui-focusVisible{'));

    expect(focus.at(-1)).toContain(`outline:2px solid ${FOCUS_RING};`);
    expect(focus.at(-1)).toContain('outline-offset:-2px;');
    expect(focus.at(-1)).toContain('box-shadow:inset 0 0 0 4px var(--pie-background, #ffffff);');
  });

  it('fold the LaTeX key ripple dark, as on label keys', () => {
    renderKeypad();
    const ripple = rulesFor(screen.getByRole('button', { name: 'Overline' })).filter((r) =>
      r.includes(' .MuiTouchRipple-root{'),
    );

    expect(ripple.at(-1)).toContain('color:rgb(from var(--pie-text, black) min(r, 255 - r)');
  });

  it('ink label keys and LaTeX labels with the keypad ink, after a --pie-text fallback', () => {
    renderKeypad();
    const label = rulesFor(screen.getByRole('button', { name: 'seven' }));
    const glyph = screen.getByRole('button', { name: 'Overline' }).querySelector('span')!;
    const ink = `color:${color.text()};color:${color.keypadInk()};`;

    expect(label.some((r) => r.includes(ink))).toBe(true);
    expect(rulesFor(glyph).some((r) => r.includes(ink))).toBe(true);
  });

  it('render a key with nothing to show or do as an inert, hidden grid filler', () => {
    const { container } = render(<KeyPad onPress={() => {}} mode="language" additionalKeys={[[{ category: 'vars' }]]} />);
    const filler = container.querySelector('button')!;

    expect(filler).toBeDisabled();
    expect(filler).toHaveAttribute('aria-hidden', 'true');
    expect(filler).toHaveAttribute('tabindex', '-1');
  });
});
