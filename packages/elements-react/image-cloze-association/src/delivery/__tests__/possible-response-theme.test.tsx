import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DndContext } from '@dnd-kit/core';

import PossibleResponse from '../possible-response';

// The dark preset redefines --pie-background and --pie-text but keeps --pie-white absolute.
const DARK = {
  '--pie-background': '#1a202c',
  '--pie-text': '#e2e8f0',
  '--pie-white': '#ffffff',
} as CSSProperties;

const renderTile = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <DndContext>
        <PossibleResponse canDrag data={{ id: 'a1', value: 'Mercury' }} onDragBegin={() => {}} />
      </DndContext>
    </div>,
  );
  return getComputedStyle(screen.getByText('Mercury').closest('.textAnswerChoiceStyle') as HTMLElement);
};

describe('image-cloze-association possible response', () => {
  it('sits on the theme background in the theme text colour', () => {
    const tile = renderTile(DARK);

    expect(tile.backgroundColor).toBe('#1a202c');
    expect(tile.color).toBe('#e2e8f0');
  });

  it('stays white with black text when no theme is applied', () => {
    const tile = renderTile({});

    expect(tile.backgroundColor).toBe('#ffffff');
    expect(tile.color).toBe('black');
  });
});
