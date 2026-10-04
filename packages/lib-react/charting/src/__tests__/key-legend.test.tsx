import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import KeyLegend from '../key-legend';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
} as CSSProperties;

const renderLegend = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <KeyLegend language="en_US" />
    </div>,
  );
  return getComputedStyle(screen.getByText('Key').parentElement as HTMLElement);
};

describe('charting KeyLegend', () => {
  it('paints the legend on the theme background in the theme text colour', () => {
    const legend = renderLegend(DARK);

    expect(legend.backgroundColor).toBe('#1a202c');
    expect(legend.color).toBe('#e2e8f0');
  });

  it('stays white when no theme is applied', () => {
    expect(renderLegend({}).backgroundColor).toBe('#ffffff');
  });

  it.each([
    ['en_US', 'Key'],
    ['es_ES', 'Clave'],
  ])('titles the legend in the %s item language', (language, title) => {
    render(<KeyLegend language={language} />);

    expect(screen.getByText(title)).toBeInTheDocument();
  });
});
