import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on spacing.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { withMask } = await import('../with-mask');

// Stands in for a drag-in-the-blank response area, so the test reads only the mask's spacing.
const Blanks = withMask('blank', () => (node: any) => {
  const { component, id } = node.data?.dataset || {};
  return component === 'blank' ? <span key={id} data-testid="blank" /> : undefined;
});

const renderMarkup = (markup: string) => render(<Blanks markup={markup} value={{}} onChange={vi.fn()} />);

// The spacer is the only element the mask renders that is neither markup nor a blank.
const isSpacer = (node: ChildNode | null | undefined) => node instanceof HTMLSpanElement && node.dataset.testid !== 'blank';

describe('Mask blank spacing', () => {
  it('spaces a blank from the text around it', () => {
    const { container } = renderMarkup('<p>The {{0}} is red.</p>');

    const blank = container.querySelector('[data-testid="blank"]');
    expect(isSpacer(blank?.previousSibling)).toBe(true);
    expect(isSpacer(blank?.nextSibling)).toBe(true);
  });

  it('leaves a blank in a table cell unspaced', () => {
    const { container } = renderMarkup('<table><tbody><tr><td>{{0}}</td><td>{{1}}</td></tr></tbody></table>');

    const cells = [...container.querySelectorAll('td')];
    expect(cells).toHaveLength(2);
    for (const cell of cells) {
      expect([...cell.childNodes].map((n) => (n as HTMLElement).dataset?.testid)).toEqual(['blank']);
    }
  });

  it('adds no spacing around inline markup', () => {
    const { container } = renderMarkup('<p>It <b>was</b> the {{0}} of times<sup>1</sup>.</p>');

    const spacers = [...container.querySelectorAll('span')].filter(isSpacer);
    expect(spacers).toHaveLength(2);
  });
});
