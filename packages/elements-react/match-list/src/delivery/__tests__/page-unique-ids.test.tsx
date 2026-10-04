import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Main } from '../main';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// main.tsx is untyped, so its class declares no props.
const MatchList = Main as unknown as React.ComponentType<{ model: object; session: object; onSessionChange: () => void }>;

const model = {
  mode: 'gather',
  config: {
    prompt: 'Match each event to its year.',
    prompts: [
      { id: 1, title: 'Boston Tea Party', relatedAnswer: 3 },
      { id: 2, title: 'Declaration of Independence', relatedAnswer: 4 },
    ],
    answers: [
      { id: 3, title: '1773' },
      { id: 4, title: '1776' },
    ],
  },
};

const item = () => <MatchList model={model} session={{ value: { 2: 4 } }} onSessionChange={vi.fn()} />;

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

const references = (root: ParentNode, name: string) => [
  ...new Set([...root.querySelectorAll(`[${name}]`)].flatMap((el) => (el.getAttribute(name) || '').split(/\s+/))),
];

describe('match-list ids', () => {
  it('stay unique when two items share a page', () => {
    const first = render(item()).container;
    const second = render(item()).container;

    expect(new Set(ids(document)).size).toBe(ids(document).length);
    // The drag instructions every tile references: dnd-kit's own `DndDescribedBy-<n>` counter
    // restarts in each element bundle, so the id must come from the item.
    const [instructions] = references(first, 'aria-describedby');
    expect(references(first, 'aria-describedby')).toHaveLength(1);
    expect(instructions).not.toMatch(/^DndDescribedBy-\d+$/);
    expect(references(second, 'aria-describedby')).not.toEqual([instructions]);
  });

  it('resolve labels and drag instructions inside their own item', () => {
    const first = render(item()).container;
    const second = render(item()).container;

    for (const root of [first, second]) {
      const refs = [...references(root, 'aria-labelledby'), ...references(root, 'aria-describedby')];
      expect(refs.length).toBeGreaterThan(1);
      for (const id of refs) {
        expect(root.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('stay the same across re-renders', () => {
    const { container, rerender } = render(item());
    const before = [...ids(container), ...references(container, 'aria-describedby')];

    rerender(item());

    expect([...ids(container), ...references(container, 'aria-describedby')]).toEqual(before);
  });
});
