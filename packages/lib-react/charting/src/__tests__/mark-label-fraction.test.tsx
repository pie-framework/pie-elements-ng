import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// MathJax typesets what MarkLabel writes into the label; it has no bearing on whether the label is written.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { MarkLabel } = await import('../mark-label');

// The chart owns the category and hands the label back down, as `TickComponent` does.
const Category = ({ initialLabel }: { initialLabel: string }) => {
  const [label, setLabel] = useState(initialLabel);

  return (
    <MarkLabel
      mark={{ label }}
      ariaLabel="Category 1 label"
      mathAriaLabel="Category 1 label, a fraction"
      barWidth={80}
      onChange={setLabel}
    />
  );
};

const input = () => screen.getByRole('textbox', { name: 'Category 1 label' });
const fraction = () => screen.getByRole('button', { name: 'Category 1 label, a fraction' });

const typeAndLeave = (value: string) => {
  fireEvent.change(input(), { target: { value } });
  fireEvent.blur(input());
};

describe('a category label that is a fraction', () => {
  it('shows as a fraction once it has been typed and left', () => {
    render(<Category initialLabel="Apples" />);

    typeAndLeave('1/2');

    expect(fraction()).toHaveTextContent('\\frac{1}{2}');
  });

  // Clicking back into the fraction swaps it for the input, and leaving swaps the fraction back in. The
  // fraction is written into its element by an effect, so the element has to be written to each time it
  // is put back — not only when the label changes, which it has not.
  it('is still shown after clicking back into it and leaving without changing it', () => {
    render(<Category initialLabel="1/2" />);

    fireEvent.click(fraction());
    expect(input()).toHaveValue('1/2');
    fireEvent.blur(input());

    expect(fraction()).toHaveTextContent('\\frac{1}{2}');
  });

  // The fraction is shown once typing stops, not as soon as what has been typed looks like one — or "1/2"
  // could not be carried on into "1/20", or "1 1/2".
  it('does not replace the input while a fraction is still being typed', () => {
    render(<Category initialLabel="Apples" />);

    fireEvent.change(input(), { target: { value: '1/2' } });
    expect(input()).toHaveValue('1/2');
    expect(screen.queryByRole('button', { name: 'Category 1 label, a fraction' })).toBeNull();

    fireEvent.change(input(), { target: { value: '1/20' } });
    fireEvent.blur(input());

    expect(fraction()).toHaveTextContent('\\frac{1}{20}');
  });

  it('is still shown after reopening and leaving it more than once', () => {
    render(<Category initialLabel="3/4" />);

    for (let i = 0; i < 3; i++) {
      fireEvent.click(fraction());
      fireEvent.blur(input());
    }

    expect(fraction()).toHaveTextContent('\\frac{3}{4}');
  });

  it('shows the new fraction after one is edited into another', () => {
    render(<Category initialLabel="1/2" />);

    fireEvent.click(fraction());
    typeAndLeave('3/4');

    expect(fraction()).toHaveTextContent('\\frac{3}{4}');
  });

  it('goes back to plain text when a fraction is edited into text', () => {
    render(<Category initialLabel="1/2" />);

    fireEvent.click(fraction());
    typeAndLeave('Half');

    expect(screen.queryByRole('button', { name: 'Category 1 label, a fraction' })).toBeNull();
    expect(input()).toHaveValue('Half');
  });
});

// Integers and decimals are typeset like fractions, so a mix of them on one axis looks alike.
describe('a category label that is another kind of number', () => {
  it.each([
    ['3', '3'],
    ['2.5', '2.5'],
    ['-2', '-2'],
    ['-0.5', '-0.5'],
    ['-1/2', '-\\frac{1}{2}'],
    ['-1 1/2', '-1\\frac{1}{2}'],
    ['1 1/2', '1\\frac{1}{2}'],
  ])('shows %s as math', (value, math) => {
    render(<Category initialLabel="Apples" />);

    typeAndLeave(value);

    expect(fraction()).toHaveTextContent(math, { normalizeWhitespace: false });
  });

  it.each(['Apples', '1st', '1/', '1.2.3', '- 1'])('leaves %s as plain text', (value) => {
    render(<Category initialLabel="Apples" />);

    typeAndLeave(value);

    expect(screen.queryByRole('button', { name: 'Category 1 label, a fraction' })).toBeNull();
  });
});

// a label shown as math must not stand out from the plain-text labels beside it (PIE-1249)
describe('the color of a category label shown as math', () => {
  it('is the color of a label shown as the input', () => {
    render(<Category initialLabel="Apples" />);
    const inputColor = getComputedStyle(input()).color;

    typeAndLeave('1/2');

    expect(getComputedStyle(fraction()).color).toBe(inputColor);
  });
});
