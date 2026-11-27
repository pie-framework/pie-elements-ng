import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the announcements.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: DragInTheBlank } = await import('../drag-in-the-blank');

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

    for (const text of [
      'Selected answer choice alpha. Use TAB to choose a blank.',
      '2 available answer choices.',
      'End of available answer choices. Use TAB to move to an answer choice.',
    ]) {
      expect(screen.getByText(text)).toHaveClass('mathjax_ignore');
    }
    expect(screen.getByText(/^This question has 2 blanks/)).toHaveClass('mathjax_ignore');
  });

  it("keeps MathJax out of dnd-kit's live region and drag instructions too", () => {
    const { container } = render(<DragInTheBlank {...props} onChange={vi.fn()} />);
    const liveRegion = container.querySelector('[id^="DndLiveRegion"]');
    const tile = screen.getByRole('button', { name: 'Answer choice: alpha' });
    const instructions = container.querySelector(`[id="${tile.getAttribute('aria-describedby')}"]`);

    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
    expect(liveRegion?.closest('.mathjax_ignore')).not.toBeNull();
    expect(instructions).toHaveTextContent(/./);
    expect(instructions?.closest('.mathjax_ignore')).not.toBeNull();
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

    expect(screen.getByText('Selected answer choice alpha. Use TAB to choose a blank.')).toHaveAttribute('role', 'status');

    fireEvent.click(screen.getByRole('button', { name: 'Blank 2 is empty' }));

    expect(onChange).toHaveBeenCalledWith({ '1': 'a' });
    expect(screen.getByText(/^Placed answer choice alpha in blank 2\. 1 of 2 blanks have an answer choice\. 1 available/)).toHaveAttribute(
      'role',
      'status',
    );
  });
});
