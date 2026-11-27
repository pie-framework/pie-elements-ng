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

  it('sets blanks written with nothing between them one narrow gap apart', () => {
    const { container } = renderMarkup('<div style="min-width: 530px">{{0}}{{1}}{{2}}</div>');

    const blanks = [...container.querySelectorAll('[data-testid="blank"]')];
    expect(blanks).toHaveLength(3);
    const before = blanks[0].previousSibling as HTMLElement;
    const after = blanks[2].nextSibling as HTMLElement;
    expect(isSpacer(before)).toBe(true);
    expect(isSpacer(after)).toBe(true);
    for (const [left, right] of [
      [blanks[0], blanks[1]],
      [blanks[1], blanks[2]],
    ]) {
      const gap = left.nextSibling as HTMLElement;
      expect(isSpacer(gap)).toBe(true);
      expect(gap.nextSibling).toBe(right);
      // Not the spacer that separates the run from what is around it.
      expect(gap.className).not.toBe(before.className);
    }
  });

  it('keeps the spacers between blanks a space separates', () => {
    const { container } = renderMarkup('<p>{{0}} {{1}}</p>');

    for (const blank of container.querySelectorAll('[data-testid="blank"]')) {
      expect(isSpacer(blank.previousSibling)).toBe(true);
      expect(isSpacer(blank.nextSibling)).toBe(true);
    }
  });

  it('adds no spacing around inline markup', () => {
    const { container } = renderMarkup('<p>It <b>was</b> the {{0}} of times<sup>1</sup>.</p>');

    const spacers = [...container.querySelectorAll('span')].filter(isSpacer);
    expect(spacers).toHaveLength(2);
  });
});
