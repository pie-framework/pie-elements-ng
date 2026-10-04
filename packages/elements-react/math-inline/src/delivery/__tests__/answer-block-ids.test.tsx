import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Main } from '../main';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// main.tsx is untyped, so its class declares no props.
const MathInline = Main as unknown as React.ComponentType<{ model: object; session: object; onSessionChange: () => void }>;

// Every item on a page carries the same element id and the same response ids, r1 and r2.
const item = (mode: 'gather' | 'view', answers: [string, string]) => (
  <MathInline
    model={{
      disabled: mode === 'view',
      view: mode === 'view',
      config: {
        id: '1',
        expression: '{{response}} + 1 = {{response}}',
        responseType: 'Advanced Multi',
        responses: [{ id: '1', answer: 'x', alternates: {} }],
        env: { mode, role: 'student' },
      },
    }}
    session={{ answers: { r1: { value: answers[0] }, r2: { value: answers[1] } } }}
    onSessionChange={vi.fn()}
  />
);

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

const describedBy = (root: ParentNode) =>
  [...root.querySelectorAll('[aria-describedby]')].flatMap((el) =>
    (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean),
  );

const answerBlock = (root: ParentNode, responseId: string) =>
  root.querySelector(`[data-answer-block="${responseId}"]`)?.textContent;

describe('math-inline answer blocks', () => {
  it.each(['gather', 'view'] as const)('repeat no id when two items share a page (%s)', (mode) => {
    render(item(mode, ['12', '34']));
    render(item(mode, ['56', '78']));

    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('show each item its own answers and keypad instructions', () => {
    const first = render(item('view', ['12', '34'])).container;
    const second = render(item('view', ['56', '78'])).container;

    expect([answerBlock(first, 'r1'), answerBlock(first, 'r2')]).toEqual([
      expect.stringContaining('12'),
      expect.stringContaining('34'),
    ]);
    expect([answerBlock(second, 'r1'), answerBlock(second, 'r2')]).toEqual([
      expect.stringContaining('56'),
      expect.stringContaining('78'),
    ]);

    for (const root of [render(item('gather', ['', ''])).container, render(item('gather', ['', ''])).container]) {
      expect(describedBy(root)).toHaveLength(2);
      for (const id of describedBy(root)) {
        expect(root.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('keep their ids across re-renders', () => {
    const { container, rerender } = render(item('gather', ['12', '34']));
    const before = [...ids(container), ...describedBy(container)];

    rerender(item('gather', ['12', '34']));

    expect([...ids(container), ...describedBy(container)]).toEqual(before);
  });
});
