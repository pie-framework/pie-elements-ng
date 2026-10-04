import React from 'react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RawDoneButton } from '../src/components/common/done-button';

// The dark preset redefines --pie-background and --pie-text; no preset sets the toolbar check.
const DARK = { '--pie-background': '#1a202c', '--pie-text': '#e2e8f0' } as CSSProperties;

const renderButton = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <RawDoneButton onClick={() => {}} />
    </div>
  );
  return getComputedStyle(screen.getByRole('button', { name: 'Done' }));
};

describe('editor toolbar Done button', () => {
  // One green clears 3:1 against the toolbar fill and its hover fill in every theme.
  it.each([
    ['the dark theme', DARK],
    ['no theme', {}],
  ])('draws the check in the same green under %s', (_, vars) => {
    expect(renderButton(vars as CSSProperties).color).toBe('#388E3C');
  });

  it('takes the colour a host sets', () => {
    const vars = { '--editable-html-toolbar-check': '#1b5e20' } as CSSProperties;

    expect(renderButton(vars).color).toBe('#1b5e20');
  });
});
