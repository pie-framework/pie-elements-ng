import { act, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { KEYPAD_ATTRIBUTE, KEYPAD_CARET_CLASS, keepCaretWhileKeypadFocused } from '../src/mf/inactive-caret';
import { KeyPad } from '../src/keypad/index';

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

/**
 * MathLive cannot load under happy-dom, so a focusable element stands in for the `<math-field>`:
 * the tracker only listens for its blur and sets a class on it.
 */
const setup = ({ readOnly = false, prompts = [] as unknown[] } = {}) => {
  document.body.innerHTML = `
    <div>
      <span tabindex="0" data-testid="field"></span>
      <span tabindex="0" data-testid="field2"></span>
      <div ${KEYPAD_ATTRIBUTE}="">
        <button type="button" data-testid="plus">+</button>
        <button type="button" data-testid="minus">-</button>
      </div>
      <button type="button" data-testid="elsewhere">other</button>
    </div>`;
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const field = Object.assign(get('field'), { readOnly, getPrompts: () => prompts });
  const stop = keepCaretWhileKeypadFocused(field);

  return {
    field,
    stop,
    field2: get('field2'),
    plus: get('plus'),
    minus: get('minus'),
    elsewhere: get('elsewhere'),
    shown: () => field.classList.contains(KEYPAD_CARET_CLASS),
  };
};

let cleanup: (() => void) | undefined;

afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  document.body.innerHTML = '';
});

describe('caret while a keypad button has focus', () => {
  it('keeps the caret, and removes it when focus moves elsewhere', async () => {
    const { field, plus, elsewhere, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    await settle();
    expect(shown()).toBe(true);

    elsewhere.focus();
    await settle();
    expect(shown()).toBe(false);
  });

  it('does not keep the caret when focus leaves for something other than the keypad', async () => {
    const { field, elsewhere, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    elsewhere.focus();
    await settle();

    expect(shown()).toBe(false);
  });

  it('keeps the caret while focus moves between keypad buttons', async () => {
    const { field, plus, minus, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    minus.focus();
    await settle();

    expect(shown()).toBe(true);
  });

  it('hands back to the field when it is refocused', async () => {
    const { field, plus, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    field.focus();
    await settle();

    expect(shown()).toBe(false);
  });

  it('shows the caret again on a second trip to the keypad', async () => {
    const { field, plus, elsewhere, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    elsewhere.focus();
    field.focus();
    plus.focus();
    await settle();

    expect(shown()).toBe(true);
  });

  it('removes the caret when focus moves on to another field', async () => {
    const { field, field2, plus, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    field2.focus();
    await settle();

    expect(shown()).toBe(false);
  });

  it('removes the caret when focus leaves the keypad for nothing focusable', async () => {
    const { field, plus, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    plus.blur();
    await settle();

    expect(shown()).toBe(false);
  });

  it('shows no caret when the field was not focused before the keypad', async () => {
    const { plus, shown, stop } = setup();
    cleanup = stop;

    plus.focus();
    await settle();

    expect(shown()).toBe(false);
  });

  it('shows no caret for a read-only field', async () => {
    const { field, plus, shown, stop } = setup({ readOnly: true });
    cleanup = stop;

    field.focus();
    plus.focus();
    await settle();

    expect(shown()).toBe(false);
  });

  it('shows the caret for a read-only field with answer blocks', async () => {
    const { field, plus, shown, stop } = setup({ readOnly: true, prompts: ['r1'] });
    cleanup = stop;

    field.focus();
    plus.focus();
    await settle();

    expect(shown()).toBe(true);
  });

  it('removes the caret and stops listening when torn down', async () => {
    const { field, plus, elsewhere, shown, stop } = setup();

    field.focus();
    plus.focus();
    await settle();
    stop();
    expect(shown()).toBe(false);

    elsewhere.focus();
    field.focus();
    plus.focus();
    await settle();
    expect(shown()).toBe(false);
  });
});

describe('keypad', () => {
  it('marks its root, so a field can tell focus moved to it', () => {
    const { container } = render(<KeyPad onPress={() => {}} />);

    expect(container.querySelector(`[${KEYPAD_ATTRIBUTE}]`)).not.toBeNull();
  });
});
