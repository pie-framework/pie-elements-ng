import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the announcements.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: DragInTheBlank } = await import('../drag-in-the-blank');

// A message is said as its own node inside the live region, which empties itself shortly after.
const regionOf = (text: string | RegExp) => screen.getByText(text).closest('[role="status"]');

const props = {
  markup: 'One {{0}} two {{1}}',
  choices: [
    { id: 'a', value: 'alpha' },
    { id: 'b', value: 'beta' },
  ],
  value: {},
  language: 'en-US',
};

describe('DragInTheBlank screen reader announcements', () => {
  it('reads the intro, and the pool around the available choices', () => {
    const { container } = render(<DragInTheBlank {...props} onChange={vi.fn()} />);

    expect(container.textContent).toContain('This question has 2 blanks and 2 answer choices.');
    expect(container.textContent).toContain('2 available answer choices.');
    // The count opens the pool and the end marker closes it.
    const text = container.textContent as string;
    expect(text.indexOf('2 available answer choices.')).toBeLessThan(text.indexOf('End of available answer choices.'));
    expect(screen.getByText('End of available answer choices. Use TAB to move to an answer choice.').compareDocumentPosition(
      screen.getByRole('button', { name: 'Answer choice: beta' }),
    ) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Answer choice: alpha' })).toBeInTheDocument();
  });

  it('keeps MathJax out of the hidden text, whose math is in words already', () => {
    render(<DragInTheBlank {...props} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: alpha' }));

    expect(regionOf('Selected answer choice alpha. Use TAB to choose a blank.')).toHaveClass('mathjax_ignore');
    for (const text of [
      '2 available answer choices.',
      'End of available answer choices. Use TAB to move to an answer choice.',
    ]) {
      expect(screen.getByText(text)).toHaveClass('mathjax_ignore');
    }
    expect(screen.getByText(/^This question has 2 blanks/)).toHaveClass('mathjax_ignore');
  });

  it('stays quiet about what to do once the item is disabled', () => {
    const { container } = render(<DragInTheBlank {...props} disabled onChange={vi.fn()} />);

    expect(container.textContent).not.toContain('This question has');
    expect(container.textContent).not.toContain('available answer choices');
  });

  it('announces a click selection, then the placement and what is left', () => {
    const onChange = vi.fn();

    render(<DragInTheBlank {...props} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Answer choice: alpha' }));

    expect(regionOf('Selected answer choice alpha. Use TAB to choose a blank.')).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('button', { name: 'Blank 2 is empty' }));

    expect(onChange).toHaveBeenCalledWith({ '1': 'a' });
    expect(regionOf(/^Placed answer choice alpha in blank 2\. 1 of 2 blanks have an answer choice\. 1 available/)).toHaveAttribute(
      'aria-live',
      'polite',
    );
  });

  it('empties its live region 100ms after each message, so no stale message is left to read', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });

    try {
      render(<DragInTheBlank {...props} onChange={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Answer choice: alpha' }));
      const region = regionOf('Selected answer choice alpha. Use TAB to choose a blank.') as HTMLElement;

      act(() => {
        vi.advanceTimersByTime(99);
      });
      expect(region).toHaveTextContent('Selected answer choice alpha.');

      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(region.textContent).toBe('');
    } finally {
      vi.useRealTimers();
    }
  });
});
