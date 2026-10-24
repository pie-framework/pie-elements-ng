import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: MultipleChoice } = await import('../index.js');

const TAG = 'pie-multiple-choice-keyboard-shortcuts-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MultipleChoice as CustomElementConstructor);
}

const choices = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

async function mount(model: Record<string, unknown> = {}) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = { mode: 'gather', choiceMode: 'radio', prompt: 'p', choices, keyboardEventsEnabled: true, ...model };
  element.session = {};
  await vi.waitFor(() => expect(element.querySelectorAll('.choice-input')).toHaveLength(choices.length));
  return element;
}

const firstInput = (element: HTMLElement) => element.querySelector('.choice-input input') as HTMLInputElement;

function press(target: EventTarget, init: KeyboardEventInit) {
  target.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }));
}

describe('multiple-choice keyboard shortcuts', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('selects a choice by number or letter while focus is in the item', async () => {
    const element = await mount();

    press(firstInput(element), { key: '2', code: 'Digit2' });
    expect(element.session.value).toEqual(['b']);

    press(firstInput(element), { key: 'c', code: 'KeyC' });
    expect(element.session.value).toEqual(['c']);
  });

  it('ignores a key pressed outside the item', async () => {
    const element = await mount();

    press(document.body, { key: '2', code: 'Digit2' });
    expect(element.session.value ?? []).toEqual([]);
  });

  it('answers only the item that has focus', async () => {
    const first = await mount();
    const second = await mount();

    press(firstInput(second), { key: '1', code: 'Digit1' });
    expect(second.session.value).toEqual(['a']);
    expect(first.session.value ?? []).toEqual([]);
  });

  it('leaves modified keys to the browser and assistive technology', async () => {
    const element = await mount();

    for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
      press(firstInput(element), { key: 'b', code: 'KeyB', [modifier]: true });
    }
    expect(element.session.value ?? []).toEqual([]);
  });

  it('ignores keys typed as text', async () => {
    const element = await mount();
    const field = document.createElement('input');
    element.appendChild(field);

    press(field, { key: 'b', code: 'KeyB' });
    press(firstInput(element), { key: 'b', code: 'KeyB', isComposing: true });
    expect(element.session.value ?? []).toEqual([]);
  });

  it('matches the typed letter on a Latin layout', async () => {
    const element = await mount();

    // AZERTY: the key in the US Q position types a, and the US A position types q.
    press(firstInput(element), { key: 'q', code: 'KeyA' });
    expect(element.session.value ?? []).toEqual([]);
    press(firstInput(element), { key: 'a', code: 'KeyQ' });
    expect(element.session.value).toEqual(['a']);
    // AZERTY's unshifted digit row types symbols; the physical key names the digit.
    press(firstInput(element), { key: 'é', code: 'Digit2' });
    expect(element.session.value).toEqual(['b']);
  });

  it('falls back to the physical key on a layout without Latin letters', async () => {
    const element = await mount();

    press(firstInput(element), { key: 'ذ', code: 'KeyC' });
    expect(element.session.value).toEqual(['c']);
  });

  it('does nothing unless the model enables it', async () => {
    const element = await mount({ keyboardEventsEnabled: false });

    press(firstInput(element), { key: '1', code: 'Digit1' });
    expect(element.session.value ?? []).toEqual([]);
  });
});
