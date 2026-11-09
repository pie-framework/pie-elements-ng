import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('mathlive', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  MathfieldElement: (await import('./fake-mathlive')).FakeMathfieldElement,
}));

// The first render waits for MathLive's module graph to load.
const LOAD = { timeout: 10_000 };

// Load MathLive before the first field mounts, as on a page that already shows math.
beforeAll(async () => {
  const { loadMathLive } = await import('@pie-lib/math-input-mathlive');
  await loadMathLive();
  // The custom element holds its first render until the chrome locale is resident; so does this.
  const { loadLocale } = await import('@pie-element/shared-i18n');
  await loadLocale('es_ES');
});

const { Main } = await import('../main');
const { default: SimpleQuestionBlock } = await import('../simple-question-block');

// main.tsx is untyped, so its class declares no props.
const MathInline = Main as unknown as React.ComponentType<{
  model: object;
  session: object;
  language?: string;
  onSessionChange: () => void;
}>;

const item = (language?: string) => (
  <MathInline
    model={{
      language,
      config: {
        id: '1',
        expression: '{{response}} + 1 = {{response}}',
        responseType: 'Advanced Multi',
        responses: [{ id: '1', answer: 'x', alternates: {} }],
        env: { mode: 'gather', role: 'student' },
      },
    }}
    session={{ answers: { r1: { value: '' }, r2: { value: '' } } }}
    // The element passes the player's locale, else the declared language.
    language={language}
    onSessionChange={vi.fn()}
  />
);

const describedBy = (root: HTMLElement) =>
  [...root.querySelectorAll('math-field')].map((field) => field.getAttribute('aria-describedby') as string);

// The answer field mounts once MathLive has loaded.
const renderItem = async (language?: string) => {
  const view = render(item(language));
  await waitFor(() => expect(describedBy(view.container)).toHaveLength(1), LOAD);

  return view;
};

afterEach(() => {
  vi.useRealTimers();
});

describe('math-inline keypad instructions', () => {
  it('describe each field from inside its own item when two items share a page', async () => {
    const first = (await renderItem()).container;
    const second = (await renderItem()).container;

    const ids = [...describedBy(first), ...describedBy(second)];
    expect(new Set(ids).size).toBe(2);
    for (const root of [first, second]) {
      for (const id of describedBy(root)) {
        expect(root.contains(document.getElementById(id))).toBe(true);
      }
    }
  });

  it('keep their ids when the item updates', async () => {
    const { container, rerender } = await renderItem();
    const before = describedBy(container);

    rerender(item());

    expect(describedBy(container)).toEqual(before);
    expect(container.querySelectorAll('.sr-only')).toHaveLength(1);
  });

  it.each([
    ['en_US', /^This field supports both keypad and keyboard input\./],
    ['es_ES', /^Este campo admite la entrada con el teclado en pantalla y con el teclado físico\./],
    [undefined, /^This field supports both keypad and keyboard input\./],
  ])('are in the %s chrome language', async (language, text) => {
    const { container } = await renderItem(language);

    for (const id of describedBy(container)) {
      expect(document.getElementById(id)?.textContent).toMatch(text);
    }
  });

  it('follow a language change after the first render', async () => {
    const { container, rerender } = await renderItem('en_US');

    rerender(item('es_ES'));

    for (const id of describedBy(container)) {
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
