import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';

// happy-dom parses `<math>` into the HTML namespace, where DOMPurify drops it. A browser keeps it.
vi.mock('@pie-element/shared-utils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sanitizeModelHtml: (html: string) => html,
}));

const { default: Choice } = await import('../categorize/choice');

// Chrome leaves MathML out of a control's name from content, so a choice that holds math has none.
const SQUARED = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';

const renderChoice = (content: string) =>
  render(
    <DndContext>
      <Choice id="c1" content={content} />
    </DndContext>
  );

describe('categorize choice names', () => {
  it('names a choice from its math', () => {
    renderChoice(SQUARED);

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });

  it('leaves a text choice to its content', () => {
    renderChoice('Antigone');

    expect(screen.getByRole('button', { name: 'Antigone' }).hasAttribute('aria-label')).toBe(false);
  });
});
