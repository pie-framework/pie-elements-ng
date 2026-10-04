import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RawDoneButton } from '../done-button';

// The dark preset redefines --pie-background but keeps --pie-white absolute.
const DARK = { '--pie-background': '#1a202c', '--pie-white': '#ffffff' } as CSSProperties;

const renderButton = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <RawDoneButton hideBackground onClick={() => {}} />
    </div>,
  );
  return getComputedStyle(screen.getByRole('button', { name: 'Done' }));
};

describe('math toolbar Done button', () => {
  it('sits on the theme background when the toolbar background is hidden', () => {
    expect(renderButton(DARK).backgroundColor).toBe('#1a202c');
  });

  it('stays white when no theme is applied', () => {
    expect(renderButton({}).backgroundColor).toBe('#ffffff');
  });

  // One green clears 3:1 against the toolbar grey, white, the hover fills and the dark background.
  it.each([
    ['the dark theme', DARK],
    ['no theme', {}],
  ])('draws the check in the same green under %s', (_, vars) => {
    expect(renderButton(vars as CSSProperties).color).toBe('#388E3C');
  });
});
