import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { Main } from '../main';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// main.tsx is untyped, so its class declares no props.
const MathTemplated = Main as unknown as React.ComponentType<{
  model: object;
  session: object;
  onSessionChange: () => void;
}>;

// Every item on a page carries the same response ids, r0 and r1.
const item = (mode: 'gather' | 'view', answers: [string, string]) => (
  <MathTemplated
    model={{
      disabled: mode === 'view',
      view: mode === 'view',
      markup: '<p>{{0}} + 1 = {{1}}</p>',
      responses: {
        0: { id: '1', answer: 'x', alternates: {} },
        1: { id: '1', answer: 'x+1', alternates: {} },
      },
      env: { mode, role: 'student' },
    }}
    session={{ answers: { r0: { value: answers[0] }, r1: { value: answers[1] } } }}
    onSessionChange={vi.fn()}
  />
);

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

const answerBlock = (root: ParentNode, responseId: string) =>
  root.querySelector(`[data-answer-block="${responseId}"]`)?.textContent;

describe('math-templated answer blocks', () => {
  it.each(['gather', 'view'] as const)('repeat no id when two items share a page (%s)', (mode) => {
    render(item(mode, ['12', '34']));
    render(item(mode, ['56', '78']));

    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('show each item its own answers', () => {
    const first = render(item('view', ['12', '34'])).container;
    const second = render(item('view', ['56', '78'])).container;

    expect([answerBlock(first, 'r0'), answerBlock(first, 'r1')]).toEqual([
      expect.stringContaining('12'),
      expect.stringContaining('34'),
    ]);
    expect([answerBlock(second, 'r0'), answerBlock(second, 'r1')]).toEqual([
      expect.stringContaining('56'),
      expect.stringContaining('78'),
    ]);
    expect(first.querySelectorAll('[data-answer-block-index]')).toHaveLength(2);
  });

  it('keep their ids across re-renders', () => {
    const { container, rerender } = render(item('gather', ['12', '34']));
    const before = ids(container);

    rerender(item('gather', ['12', '34']));

    expect(ids(container)).toEqual(before);
  });
});
