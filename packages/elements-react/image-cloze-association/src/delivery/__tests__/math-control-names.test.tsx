import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';

// happy-dom parses `<math>` into the HTML namespace, where DOMPurify drops it. A browser keeps it.
vi.mock('@pie-element/shared-utils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sanitizeModelHtml: (html: string) => html,
}));

const { default: PossibleResponse } = await import('../possible-response');

// Chrome leaves MathML out of a control's name from content, so a response that holds math has none.
const SQUARED = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';

const renderResponse = (value: string) =>
  render(
    <DndContext>
      <PossibleResponse canDrag data={{ id: 'r1', value }} onDragBegin={vi.fn()} />
    </DndContext>
  );

describe('image-cloze-association response names', () => {
  it('names a response from its math', () => {
    renderResponse(SQUARED);

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });

  it('leaves a text response to its content', () => {
    renderResponse('Antigone');

    expect(screen.getByRole('button', { name: 'Antigone' }).hasAttribute('aria-label')).toBe(false);
  });
});
