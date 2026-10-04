import React from 'react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import PlaceHolder from '../placeholder';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white and --pie-black absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
  '--pie-black': '#000000',
} as CSSProperties;

const renderSlot = (vars: CSSProperties, props: Record<string, unknown> = {}) => {
  const { container } = render(
    <div style={vars}>
      <PlaceHolder {...props}>
        <span>1</span>
      </PlaceHolder>
    </div>,
  );
  return getComputedStyle(container.querySelector('.placeholder') as HTMLElement);
};

describe('PlaceHolder', () => {
  it('paints an answer slot on the theme background with a text-coloured border', () => {
    const slot = renderSlot(DARK);

    expect(slot.backgroundColor).toBe('#1a202c');
    expect(slot.borderTopColor).toBe('#e2e8f0');
  });

  it('keeps a disabled slot on the theme background', () => {
    expect(renderSlot(DARK, { disabled: true }).backgroundColor).toBe('#1a202c');
  });

  it('stays white with a black border when no theme is applied', () => {
    const slot = renderSlot({});

    expect(slot.backgroundColor).toBe('#ffffff');
    expect(slot.borderTopColor).toBe('black');
  });
});
