import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { Main } = await import('../main');
const { default: SimpleQuestionBlock } = await import('../simple-question-block');

// The item's rendered MathQuill fields, reduced to what updateAria reads: each field's textarea
// inside its .mq-textarea wrapper.
const renderItem = () => {
  const root = document.createElement('div');
  root.innerHTML = [1, 2].map(() => '<span class="mq-textarea"><textarea></textarea></span>').join('');
  document.body.appendChild(root);

  // main.tsx is untyped, so its class declares no props.
  const item = new (Main as unknown as new (props: object) => { root: HTMLElement; updateAria: () => void })({
    model: { config: {} },
    session: {},
  });
  item.root = root;
  item.updateAria();

  return { root, item };
};

const describedBy = (root: HTMLElement) =>
  [...root.querySelectorAll('textarea')].map((textarea) => textarea.getAttribute('aria-describedby') as string);

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('math-inline keypad instructions', () => {
  it('describe each field from inside its own item when two items share a page', () => {
    const first = renderItem().root;
    const second = renderItem().root;

    const ids = [...describedBy(first), ...describedBy(second)];
    expect(new Set(ids).size).toBe(4);
    for (const root of [first, second]) {
      for (const id of describedBy(root)) {
        expect(root.contains(document.getElementById(id))).toBe(true);
      }
    }
  });

  it('keep their ids when the item updates', () => {
    const { root, item } = renderItem();
    const before = describedBy(root);

    item.updateAria();

    expect(describedBy(root)).toEqual(before);
    expect(root.querySelectorAll('.sr-only')).toHaveLength(2);
  });
});

describe('math-inline toolbar id', () => {
  it('differs between two items constructed in the same millisecond', () => {
    vi.useFakeTimers({ now: 0 });
    // simple-question-block.tsx is untyped, so its class declares no props.
    const Block = SimpleQuestionBlock as unknown as new (props: object) => { mathToolBarId: string };

    expect(new Block({}).mathToolBarId).not.toBe(new Block({}).mathToolBarId);
  });
});
