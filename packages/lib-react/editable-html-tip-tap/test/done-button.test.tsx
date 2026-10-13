import React from 'react';
import type { CSSProperties } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RawDoneButton } from '../src/components/common/done-button';

// The dark preset's --pie-background and --pie-correct-icon; no preset sets the toolbar check.
const DARK = { '--pie-background': '#1a202c', '--pie-correct-icon': '#66BB6A' } as CSSProperties;

const renderButton = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <RawDoneButton onClick={() => {}} />
    </div>
  );
  return getComputedStyle(screen.getByRole('button', { name: 'Done' }));
};

describe('editor toolbar Done button', () => {
  it.each([
    ["the scheme's correct-icon colour under the dark theme", DARK, '#66BB6A'],
    ['the correct-icon default with no theme', {}, '#087D38'],
    ['the colour a host sets over the scheme', { ...DARK, '--editable-html-toolbar-check': '#1b5e20' }, '#1b5e20'],
  ])('draws the check in %s', (_, vars, expected) => {
    expect(renderButton(vars as CSSProperties).color).toBe(expected);
  });
});
