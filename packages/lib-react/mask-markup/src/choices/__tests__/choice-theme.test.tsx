import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

// MathJax loads off a CDN and has no bearing on the chip's colours.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Choice } = await import('../choice');

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
} as CSSProperties;

const renderChip = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <DndContext>
        <Choice choice={{ id: '0', value: 'Jupiter' }} instanceId="dib" />
      </DndContext>
    </div>,
  );
  return getComputedStyle(screen.getByText('Jupiter').closest('.MuiChip-root') as HTMLElement);
};

describe('drag-in-the-blank choice chip', () => {
  it('sits on the theme background in the theme text colour', () => {
    const chip = renderChip(DARK);

    expect(chip.backgroundColor).toBe('#1a202c');
    expect(chip.color).toBe('#e2e8f0');
  });

  it('stays white when no theme is applied', () => {
    expect(renderChip({}).backgroundColor).toBe('#ffffff');
  });

  it('keeps the line height it inherits, as the legacy tile did', () => {
    expect(renderChip({}).lineHeight).toBe('normal');
  });
});
