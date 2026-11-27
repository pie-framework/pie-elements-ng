// @vitest-environment jsdom
/**
 * choicesPosition places the choices around the markup through the DOM order, never a reversed flex
 * direction, so the tab path, the reading order and text-to-speech follow what is on screen.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the layout.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: DragInTheBlank } = await import('../drag-in-the-blank');

const layoutFor = (choicesPosition?: string) => {
  const { container } = render(
    <DragInTheBlank
      markup="<p>The cat {{0}} on the mat.</p>"
      choices={[{ id: '1', value: 'sat', label: 'sat' }]}
      value={{}}
      choicesPosition={choicesPosition}
      onChange={vi.fn()}
    />,
  );
  const root = container.firstElementChild as HTMLElement;
  const text = root.textContent ?? '';

  return {
    choicesFirst: text.indexOf('sat') < text.indexOf('The cat'),
    flexDirection: root.style.flexDirection,
  };
};

describe('DragInTheBlank choicesPosition', () => {
  it.each([
    ['above', true, 'column'],
    ['left', true, 'row'],
    ['below', false, 'column'],
    ['right', false, 'row'],
    // Below by default.
    [undefined, false, 'column'],
  ])('puts the choices %s the markup in the DOM as on screen', (position, choicesFirst, flexDirection) => {
    expect(layoutFor(position)).toEqual({ choicesFirst, flexDirection });
  });
});
