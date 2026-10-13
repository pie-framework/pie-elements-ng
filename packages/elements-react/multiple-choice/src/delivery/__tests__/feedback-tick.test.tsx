import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import FeedbackTick from '../feedback-tick';

// feedback-tick.tsx is untyped, so its class declares no props.
const Tick = FeedbackTick as unknown as React.ComponentType<{ correctness?: string }>;

// The light preset sets the panel hooks to near-white fills, which as a mark read at 1.1:1.
const THEME = {
  '--pie-correct': 'rgb(1, 2, 3)',
  '--pie-incorrect': 'rgb(4, 5, 6)',
  '--feedback-correct-bg-color': '#E8F5E9',
  '--feedback-incorrect-bg-color': '#FFEBEE',
} as React.CSSProperties;

function markFill(correctness: string) {
  const { container } = render(
    <div style={THEME}>
      <Tick correctness={correctness} />
    </div>,
  );
  const mark = container.querySelector(`.${correctness}-fill`) as Element;
  return getComputedStyle(mark).fill;
}

describe('FeedbackTick', () => {
  it('fills the correct mark with --pie-correct', () => {
    expect(markFill('correct')).toBe('rgb(1, 2, 3)');
  });

  it('fills the incorrect mark with --pie-incorrect', () => {
    expect(markFill('incorrect')).toBe('rgb(4, 5, 6)');
  });
});
