import React from 'react';
import { describe, it, expect } from 'vitest';
import { createEvent, fireEvent, render, screen } from '@testing-library/react';
import RubricComponent from '../main';

const value = {
  excludeZero: false,
  points: ['Nothing correct', 'Partly correct', 'Fully correct'],
  sampleAnswers: [],
};

// main.tsx is untyped, so its class declares no props.
const Rubric = RubricComponent as unknown as React.ComponentType<{ model: object; value: typeof value }>;

// React drops a keypress whose charCode is 0, and happy-dom's KeyboardEvent has no charCode.
const pressKey = (target: HTMLElement, key: string, charCode: number) => {
  const event = createEvent.keyPress(target, { key });
  Object.defineProperty(event, 'charCode', { value: charCode });
  fireEvent(target, event);
};

describe('Rubric toggle', () => {
  it('is at least 24px tall', () => {
    render(<Rubric model={{}} value={value} />);

    expect(screen.getByRole('button', { name: 'Show Rubric' })).toHaveStyle({ minHeight: '24px' });
  });

  it('toggles from the keyboard', () => {
    render(<Rubric model={{}} value={value} />);

    const toggle = screen.getByRole('button', { name: 'Show Rubric' });
    expect(toggle).toHaveAttribute('tabindex', '0');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    pressKey(toggle, 'Enter', 13);
    expect(screen.getByRole('button', { name: 'Hide Rubric' })).toHaveAttribute('aria-expanded', 'true');

    pressKey(toggle, ' ', 32);
    expect(screen.getByRole('button', { name: 'Show Rubric' })).toHaveAttribute('aria-expanded', 'false');
  });
});
