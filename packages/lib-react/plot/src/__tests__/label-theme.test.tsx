import React from 'react';
import type { CSSProperties } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// The editor's own colours are not under test; the box around it is.
vi.mock('@pie-lib/editable-html-tip-tap', () => ({
  default: (props: { markup: string }) => <div>{props.markup}</div>,
}));

const { default: Label } = await import('../label');

// The dark preset redefines --pie-background but keeps --pie-white absolute.
const DARK = { '--pie-background': '#1a202c', '--pie-white': '#ffffff' } as CSSProperties;

const renderEditBox = (vars: CSSProperties) => {
  render(
    <div style={vars}>
      <Label side="left" text="Test Scores" graphHeight={300} graphWidth={400} disabledLabel={false} />
    </div>,
  );
  fireEvent.click(screen.getByText('Test Scores'));
  return getComputedStyle(screen.getByText('Test Scores').parentElement as HTMLElement);
};

describe('plot label edit box', () => {
  it('sits on the theme background', () => {
    expect(renderEditBox(DARK).backgroundColor).toBe('#1a202c');
  });

  it('stays white when no theme is applied', () => {
    expect(renderEditBox({}).backgroundColor).toBe('white');
  });
});
