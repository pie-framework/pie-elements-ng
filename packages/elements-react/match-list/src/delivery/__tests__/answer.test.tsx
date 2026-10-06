import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Answer } from '../answer';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
} as CSSProperties;

const renderChip = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <Answer id={1} title="Boston Tea Party" />
    </div>,
  );
  return getComputedStyle(screen.getByText('Boston Tea Party'));
};

describe('Answer', () => {
  it('paints an answer chip on the theme background', () => {
    const chip = renderChip(DARK);

    expect(chip.backgroundColor).toBe('#1a202c');
    expect(chip.color).toBe('#e2e8f0');
  });

  it('stays white when no theme is applied', () => {
    expect(renderChip({}).backgroundColor).toBe('#ffffff');
  });

  // The light preset sets the panel hooks to near-white fills, which as a border read at 1.1:1.
  it.each([
    [true, 'rgb(1, 2, 3)'],
    [false, 'rgb(4, 5, 6)'],
  ])('outlines an answer with correct=%s in the status colour, not the panel fill', (correct, expected) => {
    render(
      <div
        style={
          {
            '--pie-correct': 'rgb(1, 2, 3)',
            '--pie-incorrect': 'rgb(4, 5, 6)',
            '--feedback-correct-bg-color': '#E8F5E9',
            '--feedback-incorrect-bg-color': '#FFEBEE',
          } as CSSProperties
        }
      >
        <Answer id={1} title="Boston Tea Party" correct={correct} />
      </div>,
    );
    const outline = getComputedStyle(screen.getByText('Boston Tea Party').parentElement as HTMLElement);

    expect(outline.borderTopColor).toBe(expected);
  });
});
