import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { Main } = await import('../main');
const { default: SimpleQuestionBlock } = await import('../simple-question-block');

// The item's rendered MathQuill fields, reduced to what updateAria reads: each field's textarea
// inside its .mq-textarea wrapper.
const renderItem = (language?: string) => {
  const root = document.createElement('div');
  root.innerHTML = [1, 2].map(() => '<span class="mq-textarea"><textarea></textarea></span>').join('');
  document.body.appendChild(root);

  // main.tsx is untyped, so its class declares no props.
  const item = new (Main as unknown as new (props: object) => {
    root: HTMLElement;
    props: { model: object };
    updateAria: () => void;
  })({
    model: { config: {}, language },
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

  it.each([
    ['en_US', /^This field supports both keypad and keyboard input\./],
    ['es_ES', /^Este campo admite la entrada con el teclado en pantalla y con el teclado físico\./],
    [undefined, /^This field supports both keypad and keyboard input\./],
  ])('are in the %s item language', (language, text) => {
    const { root } = renderItem(language);

    for (const id of describedBy(root)) {
      expect(document.getElementById(id)?.textContent).toMatch(text);
    }
  });

  it('follow a language change after the first render', () => {
    const { root, item } = renderItem('en_US');

    // The component re-runs updateAria when the model language changes.
    (item as { props: object }).props = { model: { config: {}, language: 'es_ES' }, session: {} };
    item.updateAria();

    for (const id of describedBy(root)) {
      expect(document.getElementById(id)?.textContent).toMatch(/^Este campo admite/);
    }
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
