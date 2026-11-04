import { act, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import * as mq from '../src/mq/index.js';

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

const page = (field: React.ReactNode) => (
  <div>
    {field}
    <div data-math-keypad="">
      <button type="button" data-testid="plus">
        +
      </button>
      <button type="button" data-testid="minus">
        -
      </button>
    </div>
    <button type="button" data-testid="elsewhere">
      other
    </button>
  </div>
);

const handles = (container: HTMLElement) => ({
  textareas: () => Array.from(container.querySelectorAll<HTMLTextAreaElement>('.mq-editable-field textarea')),
  plus: container.querySelector<HTMLButtonElement>('[data-testid="plus"]')!,
  minus: container.querySelector<HTMLButtonElement>('[data-testid="minus"]')!,
  elsewhere: container.querySelector<HTMLButtonElement>('[data-testid="elsewhere"]')!,
  cursors: () => container.querySelectorAll('.mq-cursor'),
});

const setup = () => {
  const { container, ...rest } = render(page(<mq.Input latex="12" />));
  return { container, ...rest, ...handles(container) };
};

describe('cursor while a keypad button has focus', () => {
  it('keeps a steady cursor, and removes it when focus moves elsewhere', async () => {
    const { textareas, plus, elsewhere, cursors } = setup();

    textareas()[0].focus();
    await settle();
    expect(cursors()).toHaveLength(1);

    plus.focus();
    await settle();
    expect(cursors()).toHaveLength(1);
    expect(cursors()[0].classList.contains('mq-blink')).toBe(false);

    elsewhere.focus();
    await settle();
    expect(cursors()).toHaveLength(0);
  });

  it('does not keep the cursor when focus leaves for something other than the keypad', async () => {
    const { textareas, elsewhere, cursors } = setup();

    textareas()[0].focus();
    await settle();
    elsewhere.focus();
    await settle();

    expect(cursors()).toHaveLength(0);
  });

  it('keeps the cursor while focus moves between keypad buttons', async () => {
    const { textareas, plus, minus, cursors } = setup();

    textareas()[0].focus();
    plus.focus();
    await settle();
    minus.focus();
    await settle();

    expect(cursors()).toHaveLength(1);
    expect(cursors()[0].classList.contains('mq-blink')).toBe(false);
  });

  it('stays at the insertion point', async () => {
    const { container, textareas, plus } = setup();

    textareas()[0].focus();
    await settle();
    plus.focus();
    await settle();

    const cursor = container.querySelector('.mq-cursor')!;
    expect(cursor.parentElement?.classList.contains('mq-root-block')).toBe(true);
  });

  it('hands back to the field when it is refocused, leaving one blinking cursor', async () => {
    const { textareas, plus, cursors } = setup();

    textareas()[0].focus();
    plus.focus();
    await settle();
    textareas()[0].focus();
    await settle();

    expect(cursors()).toHaveLength(1);
    expect(textareas()[0].closest('.mq-editable-field')?.classList.contains('mq-focused')).toBe(true);
  });

  it('shows the cursor again on a second trip to the keypad', async () => {
    const { textareas, plus, elsewhere, cursors } = setup();

    textareas()[0].focus();
    plus.focus();
    await settle();
    elsewhere.focus();
    await settle();
    textareas()[0].focus();
    plus.focus();
    await settle();

    expect(cursors()).toHaveLength(1);
  });

  it('removes the cursor when focus leaves the keypad for nothing focusable', async () => {
    const { textareas, plus, cursors } = setup();

    textareas()[0].focus();
    plus.focus();
    await settle();
    plus.blur();
    await settle();

    expect(cursors()).toHaveLength(0);
  });

  it('shows no cursor when the field was not focused before the keypad', async () => {
    const { plus, cursors } = setup();

    plus.focus();
    await settle();

    expect(cursors()).toHaveLength(0);
  });

  it('leaves no cursor on a second field once focus moves on', async () => {
    const { container, rerender } = render(
      page(
        <>
          <mq.Input latex="1" />
          <mq.Input latex="2" />
        </>,
      ),
    );
    const { textareas, plus, cursors } = handles(container);

    textareas()[0].focus();
    plus.focus();
    await settle();
    expect(cursors()).toHaveLength(1);

    textareas()[1].focus();
    await settle();
    expect(cursors()).toHaveLength(1);
    expect(textareas()[1].closest('.mq-editable-field')?.classList.contains('mq-focused')).toBe(true);
    rerender(page(null));
  });

  it('survives unmounting while the cursor is shown', async () => {
    const { textareas, plus, unmount, elsewhere } = setup();

    textareas()[0].focus();
    plus.focus();
    await settle();

    expect(() => unmount()).not.toThrow();
    expect(() => elsewhere.focus()).not.toThrow();
  });

  it('survives unmounting before the cursor timer fires', async () => {
    const { textareas, plus, unmount } = setup();

    textareas()[0].focus();
    plus.focus();
    unmount();

    await expect(settle()).resolves.not.toThrow();
  });
});

describe('cursor in static math response fields', () => {
  it('keeps the cursor in a response field while a keypad button has focus', async () => {
    const { container } = render(page(<mq.Static latex={'\\MathQuillMathField[r1]{12}'} />));
    const { textareas, plus, elsewhere, cursors } = handles(container);

    textareas()[0].focus();
    await settle();
    plus.focus();
    await settle();
    expect(cursors()).toHaveLength(1);
    expect(cursors()[0].classList.contains('mq-blink')).toBe(false);

    elsewhere.focus();
    await settle();
    expect(cursors()).toHaveLength(0);
  });

  it('watches the fields that a new latex adds', async () => {
    const { container, rerender } = render(page(<mq.Static latex={'\\MathQuillMathField[r1]{}'} />));

    rerender(page(<mq.Static latex={'\\MathQuillMathField[r1]{}+\\MathQuillMathField[r2]{3}'} />));
    const { textareas, plus, cursors } = handles(container);

    textareas()[1].focus();
    await settle();
    plus.focus();
    await settle();

    expect(cursors()).toHaveLength(1);
  });

  it('only the field that was focused keeps a cursor', async () => {
    const { container } = render(
      page(<mq.Static latex={'\\MathQuillMathField[r1]{1}+\\MathQuillMathField[r2]{2}'} />),
    );
    const { textareas, plus, cursors } = handles(container);

    textareas()[1].focus();
    await settle();
    plus.focus();
    await settle();

    expect(cursors()).toHaveLength(1);
    expect(textareas()[1].closest('.mq-editable-field')?.contains(cursors()[0])).toBe(true);
  });
});
