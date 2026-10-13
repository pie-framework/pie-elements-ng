import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { ChoiceInput } from '../choice-input';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// choice-input.tsx is untyped, so its class declares no props.
const Choice = ChoiceInput as unknown as React.ComponentType<Record<string, unknown>>;

const choice = (key: string, props: object = {}) => (
  <Choice
    choiceMode="radio"
    displayKey={key}
    label={`Choice ${key}`}
    value={key}
    checked={false}
    disabled={false}
    onChange={() => {}}
    {...props}
  />
);

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

const references = (root: ParentNode) =>
  [...root.querySelectorAll('*')].flatMap((el) =>
    ['aria-labelledby', 'aria-describedby', 'for'].flatMap((name) =>
      (el.getAttribute(name) || '').split(/\s+/).filter(Boolean),
    ),
  );

describe('multiple-choice choice ids', () => {
  // A page of items carries a hundred choices or more, which a four-digit random id repeats.
  it.each(['radio', 'checkbox'])('repeat no id across a page of %s choices', (choiceMode) => {
    for (let i = 0; i < 100; i++) {
      render(choice(String.fromCharCode(65 + (i % 4)), { choiceMode }));
    }

    expect(ids(document)).toHaveLength(200);
    expect(new Set(ids(document)).size).toBe(200);
  });

  it('label each control inside its own choice', () => {
    const first = render(choice('A')).container;
    const second = render(choice('A', { choiceMode: 'checkbox' })).container;

    for (const root of [first, second]) {
      // the label's `for`
      expect(references(root)).toHaveLength(1);
      for (const id of references(root)) {
        expect(root.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('keep their ids across re-renders', () => {
    const { container, rerender } = render(choice('A'));
    const before = [...ids(container), ...references(container)];

    rerender(choice('A', { checked: true }));

    expect([...ids(container), ...references(container)]).toEqual(before);
  });
});
