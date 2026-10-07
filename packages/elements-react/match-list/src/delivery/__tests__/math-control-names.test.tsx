import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';

// happy-dom parses `<math>` into the HTML namespace, where DOMPurify drops it. A browser keeps it.
vi.mock('@pie-element/shared-utils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sanitizeModelHtml: (html: string) => html,
}));

const { default: Answer } = await import('../answer');

// Chrome leaves MathML out of a control's name from content, so an answer that holds math has none.
const SQUARED = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';

const renderAnswer = (props: Record<string, unknown>) =>
  render(
    <DndContext>
      <Answer id="a1" instanceId="i" type="choice" {...props} />
    </DndContext>
  );

describe('match-list answer names', () => {
  it('names a choice in the pool from its math', () => {
    renderAnswer({ title: SQUARED });

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });

  it('names an answer placed in a response area from its math', () => {
    renderAnswer({ title: SQUARED, promptId: 'p1', labelId: 'prompt-1', type: 'target' });

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });

  it('leaves a text answer to its content', () => {
    renderAnswer({ title: 'Antigone' });

    expect(screen.getByRole('button', { name: 'Antigone' }).hasAttribute('aria-label')).toBe(false);
  });
});
