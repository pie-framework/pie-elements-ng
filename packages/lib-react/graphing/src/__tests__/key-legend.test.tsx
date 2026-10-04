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
  const { container } = render(
    <div style={vars}>
      <KeyLegend isLabelAvailable />
    </div>,
  );
  return { legend: getComputedStyle(screen.getByText('Key').parentElement as HTMLElement), container };
};

describe('graphing KeyLegend', () => {
  it('paints the legend on the theme background in the theme text colour', () => {
    const { legend } = renderLegend(DARK);

    expect(legend.backgroundColor).toBe('#1a202c');
    expect(legend.color).toBe('#e2e8f0');
  });

  it('keeps the label swatches white, as the graph draws its mark labels', () => {
    const { container } = renderLegend(DARK);
    const swatches = container.querySelectorAll('rect[fill="white"]');

    expect(swatches).toHaveLength(4);
  });

  it('stays white when no theme is applied', () => {
    expect(renderLegend({}).legend.backgroundColor).toBe('#ffffff');
  });
});
