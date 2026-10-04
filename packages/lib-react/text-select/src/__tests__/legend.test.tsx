import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Legend } from '../legend';

// The dark preset redefines --pie-text and --pie-border-light but keeps --pie-black absolute.
const DARK = {
  '--pie-text': '#e2e8f0',
  '--pie-border-light': '#424242',
  '--pie-black': '#000000',
} as CSSProperties;

const renderLegend = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <Legend language="en_US" showOnlyCorrect={false} />
    </div>,
  );
  const key = screen.getByText('Key');
  return { key: getComputedStyle(key), rules: getComputedStyle(key.parentElement as HTMLElement) };
};

describe('select-text Legend', () => {
  it('writes the Key label in the theme text colour between theme-coloured rules', () => {
    const { key, rules } = renderLegend(DARK);

    expect(key.color).toBe('#e2e8f0');
    expect(rules.borderTopColor).toBe('#424242');
    expect(rules.borderBottomColor).toBe('#424242');
  });

  it('keeps black text and light grey rules when no theme is applied', () => {
    const { key, rules } = renderLegend({});

    expect(key.color).toBe('black');
    expect(rules.borderTopColor).toBe('lightgrey');
  });
});
