import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: MultipleChoice } = await import('../index.js');

const TAG = 'pie-multiple-choice-answer-masking-test';
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
  element.model = { mode: 'gather', choiceMode: 'radio', prompt: 'p', choices, ...model };
  element.session = {};
  await vi.waitFor(() => expect(element.querySelectorAll('.choice-input')).toHaveLength(choices.length));
  return element;
}

interface Target {
  id: string;
  label: string;
  container: HTMLElement;
  content: Element;
  isSelected(): boolean;
  isEliminable(): boolean;
  setEliminated(eliminated: boolean): void;
}

const targets = (element: any): Target[] => element.pieSupportTargets('answer-masking');

const input = (element: HTMLElement, value: string) =>
  element.querySelector<HTMLInputElement>(`.choice-input input[value="${value}"]`) as HTMLInputElement;

const target = (element: any, id: string) => targets(element).find((choice) => choice.id === id) as Target;

describe('multiple-choice answer masking', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('declares answer masking on its class', () => {
    expect(MultipleChoice.pieSupports).toEqual(['answer-masking']);
  });

  it('supplies each rendered choice by value, with its label inside its container', async () => {
    const element = await mount();

    const supplied = targets(element);

    expect(supplied.map(({ id, label }) => [id, label])).toEqual([
      ['a', 'Alpha'],
      ['b', 'Beta'],
      ['c', 'Gamma'],
    ]);
    for (const { container, content } of supplied) {
      expect(container.classList.contains('choice-input')).toBe(true);
      expect(container.contains(content)).toBe(true);
    }
    expect(element.pieSupportTargets('text-to-speech')).toEqual([]);
  });

  it('blocks selecting an eliminated choice until it is restored', async () => {
    const element = await mount();

    target(element, 'b').setEliminated(true);
    await vi.waitFor(() => expect(input(element, 'b').disabled).toBe(true));
    expect(input(element, 'a').disabled).toBe(false);

    element._onChange({ value: 'b', selected: true, selector: 'Mouse' });
    element.handleKeyDown({ key: '2' });
    expect(element.session.value ?? []).toEqual([]);

    target(element, 'b').setEliminated(false);
    await vi.waitFor(() => expect(input(element, 'b').disabled).toBe(false));
    element._onChange({ value: 'b', selected: true, selector: 'Mouse' });
    expect(element.session.value).toEqual(['b']);
  });

  it('reports a selected choice, which cannot be eliminated', async () => {
    const element = await mount();

    element._onChange({ value: 'a', selected: true, selector: 'Mouse' });

    expect(target(element, 'a').isSelected()).toBe(true);
    expect(target(element, 'a').isEliminable()).toBe(false);
    expect(target(element, 'b').isSelected()).toBe(false);
    expect(target(element, 'b').isEliminable()).toBe(true);
  });

  it.each([{ mode: 'view' }, { mode: 'evaluate' }, { disabled: true }])(
    'offers no choice for elimination with %o',
    async (model) => {
      const element = await mount(model);

      expect(targets(element).map((choice) => choice.isEliminable())).toEqual([
        false,
        false,
        false,
      ]);
    },
  );
});
