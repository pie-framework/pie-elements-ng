import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Layout } from '../choice';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
} as CSSProperties;

const renderCard = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <Layout content="Apple" />
    </div>,
  );
  return getComputedStyle(screen.getByText('Apple'));
};

describe('categorize choice card', () => {
  it('sits on the theme background in the theme text colour', () => {
    const card = renderCard(DARK);

    expect(card.backgroundColor).toBe('#1a202c');
    expect(card.color).toBe('#e2e8f0');
  });

  it('stays white when no theme is applied', () => {
    expect(renderCard({}).backgroundColor).toBe('#ffffff');
  });
});
