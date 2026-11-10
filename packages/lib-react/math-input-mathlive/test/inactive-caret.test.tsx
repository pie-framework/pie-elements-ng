import { act, render } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KEYPAD_ATTRIBUTE, KEYPAD_CARET_CLASS, keepCaretWhileKeypadFocused } from '../src/mf/inactive-caret';
import { KeyPad } from '../src/keypad/index';

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

/**
 * MathLive cannot load under happy-dom, so a focusable element stands in for the `<math-field>`:
 * the tracker listens for its blur, sets a class on it and sends it typed text.
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
      <div ${KEYPAD_ATTRIBUTE}="">
        <button type="button" data-testid="otherKeypad">7</button>
      </div>
      <button type="button" data-testid="elsewhere">other</button>
    </div>`;
  const get = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`)!;
  const field = Object.assign(get('field'), { readOnly, getPrompts: () => prompts, executeCommand: vi.fn() });
  const stop = keepCaretWhileKeypadFocused(field);

  return {
    field,
    stop,
    field2: get('field2'),
    plus: get('plus'),
    minus: get('minus'),
    elsewhere: get('elsewhere'),
    otherKeypad: get('otherKeypad'),
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

/**
 * Presses `key` on the focused element; returns whether the browser's default was left alone.
 * `altGraph` is the AltGr key's state: happy-dom reports AltGraph whenever Alt is held, which a
 * browser does not.
 */
const press = (key: string, { altGraph, ...init }: KeyboardEventInit & { altGraph?: boolean } = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  if (altGraph !== undefined) {
    Object.defineProperty(event, 'getModifierState', { value: (name: string) => name === 'AltGraph' && altGraph });
  }
  return (document.activeElement as HTMLElement).dispatchEvent(event);
};

const typed = (field: { executeCommand: ReturnType<typeof vi.fn> }) =>
  field.executeCommand.mock.calls.map(([[command, text, options]]) => {
    expect([command, options]).toEqual(['typedText', { simulateKeystroke: true }]);
    return text;
  });

const commands = (field: { executeCommand: ReturnType<typeof vi.fn> }) =>
  field.executeCommand.mock.calls.map(([command]) => command);

describe('typing while a keypad button has focus', () => {
  it('sends letters, digits and symbols to the field, keeping focus on the button', async () => {
    const { field, plus, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();

    for (const key of ['3', 'x', '+', '/', '^', 'A']) expect(press(key, { shiftKey: key === 'A' })).toBe(false);

    expect(typed(field)).toEqual(['3', 'x', '+', '/', '^', 'A']);
    expect(document.activeElement).toBe(plus);
  });

  it('sends an AltGr character', async () => {
    const { field, plus, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();

    expect(press('¿', { ctrlKey: true, altKey: true, altGraph: true })).toBe(false);
    expect(typed(field)).toEqual(['¿']);
  });

  it('deletes with Backspace and Delete, keeping focus on the button', async () => {
    const { field, plus, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();

    expect(press('Backspace')).toBe(false);
    expect(press('Delete')).toBe(false);

    expect(commands(field)).toEqual(['deleteBackward', 'deleteForward']);
    expect(document.activeElement).toBe(plus);
  });

  it('leaves space, Enter, Tab, the arrows and shortcuts to the keypad', async () => {
    const { field, plus, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();

    for (const [key, init] of [
      [' ', {}],
      ['Enter', {}],
      ['Enter', { shiftKey: true }],
      ['Tab', {}],
      ['ArrowRight', {}],
      ['Backspace', { ctrlKey: true }],
      ['Backspace', { metaKey: true }],
      ['Delete', { altKey: true, altGraph: false }],
      ['c', { ctrlKey: true }],
      ['v', { metaKey: true }],
      ['f', { altKey: true, altGraph: false }],
    ] as const) {
      expect(press(key, init)).toBe(true);
    }

    expect(field.executeCommand).not.toHaveBeenCalled();
  });

  it('takes no typing once focus has moved on from the keypad', async () => {
    const { field, plus, elsewhere, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    elsewhere.focus();
    await settle();

    expect(press('3')).toBe(true);
    expect(field.executeCommand).not.toHaveBeenCalled();
  });

  it('takes no typing when the field was not focused before the keypad', async () => {
    const { field, plus, stop } = setup();
    cleanup = stop;

    plus.focus();

    expect(press('3')).toBe(true);
    expect(field.executeCommand).not.toHaveBeenCalled();
  });

  it('takes no typing, and removes the caret, once focus moves to another field’s keypad', async () => {
    const { field, plus, otherKeypad, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    otherKeypad.focus();
    await settle();

    expect(shown()).toBe(false);
    expect(press('3')).toBe(true);
    expect(field.executeCommand).not.toHaveBeenCalled();
  });

  it('lets the key through, and removes the caret, once the field is off the page', async () => {
    const { field, plus, shown, stop } = setup();
    cleanup = stop;

    field.focus();
    plus.focus();
    field.remove();

    expect(press('3')).toBe(true);
    expect(field.executeCommand).not.toHaveBeenCalled();
    expect(shown()).toBe(false);
  });

  it('takes no typing after it is torn down', async () => {
    const { field, plus, stop } = setup();

    field.focus();
    plus.focus();
    stop();

    expect(press('3')).toBe(true);
    expect(field.executeCommand).not.toHaveBeenCalled();
  });
});

describe('keypad', () => {
  it('marks its root, so a field can tell focus moved to it', () => {
    const { container } = render(<KeyPad onPress={() => {}} />);

    expect(container.querySelector(`[${KEYPAD_ATTRIBUTE}]`)).not.toBeNull();
  });
});
