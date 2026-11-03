import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { color } from '@pie-lib/render-ui';
import { KeyPad } from '../src/keypad/index';
import { overline } from '../src/keys/geometry';

const FOCUS_RING =
  'var(--pie-focus-keyboard-outline, var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0))))';

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
  ])('outline %s on keyboard focus with a single 4px ring in the keyboard focus colour', (_, key) => {
    renderKeypad();
    const focus = rulesFor(key()).filter((r) => r.includes('.Mui-focusVisible{'));

    expect(focus.at(-1)).toContain(`outline:4px solid ${FOCUS_RING};`);
    expect(focus.at(-1)).toContain('outline-offset:-4px;');
    expect(focus.at(-1)).not.toContain('box-shadow');
  });

  it.each([
    ['a label key', () => screen.getByRole('button', { name: 'seven' })],
    ['a LaTeX key', () => screen.getByRole('button', { name: 'Overline' })],
  ])('show keyboard focus on %s without the pulsing focus ripple', async (_, key) => {
    renderKeypad();
    const button = key();

    // A key press before focus is what marks it as keyboard focus.
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => button.focus());
    // The ripple mounts lazily and only pulses once it has, a tick after focus.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(button).toHaveClass('Mui-focusVisible');
    expect(button.querySelector('.MuiTouchRipple-ripplePulsate')).toBeNull();
  });

  it('fold the LaTeX key ripple dark, as on label keys', () => {
    renderKeypad();
    const ripple = rulesFor(screen.getByRole('button', { name: 'Overline' })).filter((r) =>
      r.includes(' .MuiTouchRipple-root{'),
    );

    expect(ripple.at(-1)).toContain('color:rgb(from var(--pie-text, black) min(r, 255 - r)');
  });

  it('ink label keys and LaTeX glyphs with the keypad ink, after a --pie-text fallback', () => {
    renderKeypad();
    const label = rulesFor(screen.getByRole('button', { name: 'seven' }));
    const glyph = screen.getByRole('button', { name: 'Overline' }).querySelector('.mq-math-mode')!;
    const ink = `color:${color.text()};color:${color.keypadInk()};`;

    expect(label.some((r) => r.includes(ink))).toBe(true);
    expect(rulesFor(glyph).some((r) => r.includes(ink))).toBe(true);
  });

  it('draw the overline, overarrow and overarc glyph bars in the glyph ink', () => {
    renderKeypad();
    const glyph = screen.getByRole('button', { name: 'Overline' }).querySelector('.mq-math-mode')!;
    const rules = rulesFor(glyph);

    for (const bar of [' .mq-overline .mq-overline-inner{', ' .mq-overarrow{', ' .mq-overarc{']) {
      expect(rules.find((r) => r.includes(bar))).toMatch(/border-top:2px solid currentColor(!important)?;/);
    }
    expect(rules.join('}')).not.toMatch(/solid black/);
  });
});
