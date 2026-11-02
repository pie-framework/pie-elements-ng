import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { RawDoneButton } from '../src/done-button';

const FOCUS_RING =
  'var(--pie-focus-outline, var(--pie-button-focus-outline, var(--pie-focus-checked-border, #1565C0)))';

// The rules emotion emits for an element's own class, in source order.
const rulesFor = (el: Element) => {
  const classes = [...el.classList].filter((c) => c.startsWith('css-'));
  const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\n');
  return css.split('}').filter((r) => classes.some((c) => r.includes(`.${c}`)));
};

describe('Done button', () => {
  it('shows keyboard focus with the focus ring, without the pulsing focus ripple', async () => {
    render(<RawDoneButton onClick={() => {}} hideBackground />);
    const button = screen.getByRole('button', { name: 'Done' });

    // A key press before focus is what marks it as keyboard focus.
    fireEvent.keyDown(document.body, { key: 'Tab' });
    act(() => button.focus());
    // The ripple mounts lazily and only pulses once it has, a tick after focus.
    await act(() => new Promise((resolve) => setTimeout(resolve, 50)));

    expect(button).toHaveClass('Mui-focusVisible');
    expect(button.querySelector('.MuiTouchRipple-ripplePulsate')).toBeNull();

    const focus = rulesFor(button).filter((r) => r.includes('.Mui-focusVisible{'));
    expect(focus.at(-1)).toContain(`outline:4px solid ${FOCUS_RING};`);
  });
});
