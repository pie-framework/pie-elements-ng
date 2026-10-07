import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DndContext } from '@dnd-kit/core';
import { render, screen } from '@testing-library/react';

// happy-dom parses `<math>` into the HTML namespace, where DOMPurify drops it. A browser keeps it.
vi.mock('@pie-element/shared-utils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  sanitizeModelHtml: (html: string) => html,
}));

const { default: Tile } = await import('../tile');

// Chrome leaves MathML out of a control's name from content, so a tile that holds math has none.
const SQUARED = '<math><msup><mi>x</mi><mn>2</mn></msup></math>';

const renderTile = (label: string) =>
  render(
    <DndContext>
      <Tile id="t1" type="choice" label={label} instanceId="i" tileIndex={0} draggable />
    </DndContext>
  );

describe('placement-ordering tile names', () => {
  it('names a tile from its math', () => {
    renderTile(SQUARED);

    expect(screen.getByRole('button', { name: 'x squared' })).toBeTruthy();
  });

  it('leaves a text tile to its content', () => {
    renderTile('Antigone');

    expect(screen.getByRole('button', { name: 'Antigone' }).hasAttribute('aria-label')).toBe(false);
  });
});
