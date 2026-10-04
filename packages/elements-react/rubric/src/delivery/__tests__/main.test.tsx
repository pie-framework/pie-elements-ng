import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RubricComponent from '../main';

const value = {
  excludeZero: false,
  points: ['Nothing correct', 'Partly correct', 'Fully correct'],
  sampleAnswers: [] as string[],
};

// main.tsx is untyped, so its class declares no props.
const Rubric = RubricComponent as unknown as React.ComponentType<{ model: object; value: typeof value }>;

describe('Rubric toggle', () => {
  it('is at least 24px tall', () => {
    render(<Rubric model={{}} value={value} />);

    expect(screen.getByRole('button', { name: 'Show Rubric' })).toHaveStyle({ minHeight: '24px' });
  });
});

describe('Rubric ids', () => {
  const pageIds = () => [...document.querySelectorAll('[id]')].map((el) => el.id);

  it('stay unique when two rubrics share a page', () => {
    render(<Rubric model={{}} value={value} />);
    render(<Rubric model={{}} value={value} />);

    expect(screen.getAllByRole('button', { name: 'Show Rubric' })).toHaveLength(2);
    expect(new Set(pageIds()).size).toBe(pageIds().length);
  });

  it('stay the same across re-renders', () => {
    const { rerender } = render(<Rubric model={{}} value={value} />);
    const before = pageIds();

    rerender(<Rubric model={{}} value={{ ...value, sampleAnswers: ['None'] }} />);

    expect(pageIds()).toEqual(before);
  });
});
