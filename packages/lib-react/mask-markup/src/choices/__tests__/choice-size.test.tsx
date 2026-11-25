import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

// MathJax loads off a CDN and has no bearing on the chip's box.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Choice } = await import('../choice');

const CHOICE = { id: '0', value: 'Mona practices for the game.' };

const renderChip = (props = {}) => {
  render(
    <DndContext>
      <Choice choice={CHOICE} instanceId="dib" {...props} />
    </DndContext>,
  );
  return screen.getByText(CHOICE.value).closest('.MuiChip-root') as HTMLElement;
};

// A drag holds the token at its size and draws a copy at that size, so neither may need more room.
describe('drag-in-the-blank choice chip size', () => {
  it('keeps its 1px border when selected, drawing the ring as an outline inside it', () => {
    const chip = getComputedStyle(renderChip({ selectedItem: { fromChoice: true, choice: CHOICE } }));

    expect(chip.borderTopWidth).toBe('1px');
    expect(chip.borderLeftWidth).toBe('1px');
    expect(chip.outlineStyle).toBe('solid');
    expect(chip.outlineWidth).toBe('1px');
    expect(chip.outlineOffset).toBe('-2px');
  });

  it('draws no ring when not selected', () => {
    const chip = getComputedStyle(renderChip());

    expect(chip.borderTopWidth).toBe('1px');
    expect(chip.outlineStyle).not.toBe('solid');
  });

  it('takes no margin as the drag overlay copy, which dnd-kit sizes to the token without its margin', () => {
    const token = renderChip({ dragOverlay: true }).parentElement as HTMLElement;

    expect(getComputedStyle(token).marginLeft).toBe('0px');
    expect(getComputedStyle(token).marginRight).toBe('0px');
    expect(token.hasAttribute('dragoverlay')).toBe(false);
  });

  it('keeps its margin in the pool', () => {
    const token = renderChip().parentElement as HTMLElement;

    expect(getComputedStyle(token).marginLeft).toBe('4px');
  });
});
