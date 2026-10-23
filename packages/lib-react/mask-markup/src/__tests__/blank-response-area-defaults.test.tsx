// @vitest-environment jsdom
/**
 * The blank's emptyResponseAreaWidth/Height default to 0 through default parameters (React 19 drops
 * defaultProps on function components). An unset size must still leave the blank its minimum size.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

// MathJax loads off a CDN and has no bearing on sizing.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Blank } = await import('../components/blank');

// An empty blank, so the measured size never overrides the response-area size.
const renderBlank = (props = {}) => {
  const { container } = render(
    <DndContext>
      <Blank id="1" instanceId="dib" onChange={vi.fn()} {...props} />
    </DndContext>,
  );
  return container.querySelector('.MuiChip-root') as HTMLElement;
};

describe('Blank response area size', () => {
  it('keeps the minimum size when no response area size is given', () => {
    const chip = renderBlank();

    expect(chip.style.minWidth).toBe('90px');
    expect(chip.style.minHeight).toBe('32px');
  });

  it('uses the given response area size instead of the minimum', () => {
    const chip = renderBlank({ emptyResponseAreaWidth: '200', emptyResponseAreaHeight: 60 });

    expect(chip.style.width).toBe('200px');
    expect(chip.style.height).toBe('60px');
    expect(chip.style.minWidth).toBe('');
    expect(chip.style.minHeight).toBe('');
  });
});
