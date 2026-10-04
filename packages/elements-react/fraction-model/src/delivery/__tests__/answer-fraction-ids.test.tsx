import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import { AnswerFraction } from '../answer-fraction';

// answer-fraction.tsx is untyped, so its class declares no props.
const Fraction = AnswerFraction as unknown as React.ComponentType<Record<string, unknown>>;

const fraction = (props: object = {}) => (
  <Fraction
    model={{ allowedStudentConfig: true, maxModelSelected: 5, partsPerModel: 4 }}
    answers={{ noOfModel: 1, partsPerModel: 2 }}
    disabled={false}
    showCorrect={false}
    onAnswerChange={() => {}}
    {...props}
  />
);

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

const labelTargets = (root: ParentNode) =>
  [...root.querySelectorAll('label[for]')].map((label) => label.getAttribute('for') as string);

describe('fraction-model model inputs', () => {
  it('repeat no id when two items share a page', () => {
    render(fraction());
    render(fraction());

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('label the inputs of their own item', () => {
    const first = render(fraction()).container;
    const second = render(fraction()).container;

    for (const root of [first, second]) {
      expect(labelTargets(root)).toHaveLength(2);
      for (const id of labelTargets(root)) {
        expect(root.querySelector(`input[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('keep their ids across re-renders', () => {
    const { container, rerender } = render(fraction());
    const before = [...ids(container), ...labelTargets(container)];

    rerender(fraction({ answers: { noOfModel: 2, partsPerModel: 3 } }));

    expect([...ids(container), ...labelTargets(container)]).toEqual(before);
  });
});
