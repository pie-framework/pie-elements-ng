import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';

import { ExpandedInput as ExpandedInputImport } from '../common';

// common.tsx is untyped, so its props are inferred as all required.
const ExpandedInput = ExpandedInputImport as unknown as React.ComponentType<Record<string, unknown>>;

// The rich-text editor is replaced by the part of its DOM the hook measures: a toolbar inside the
// element that sits at the editor's left edge.
vi.mock('@pie-lib/editable-html-tip-tap', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  default: () => (
    <div data-testid="anchor">
      <div className="toolbar" data-testid="toolbar" />
      <div data-testid="editable" tabIndex={0} />
    </div>
  ),
}));

const rect = (left: number, width: number) => ({ left, right: left + width, width }) as DOMRect;

// jsdom has no layout, so give the clipping area, the anchor and the toolbar fixed boxes.
const setup = ({ anchorLeft, toolbarWidth = 290 }: { anchorLeft: number; toolbarWidth?: number }) => {
  const view = render(
    <div data-testid="clip" style={{ overflowX: 'hidden' }}>
      <ExpandedInput markup="" onChange={vi.fn()} pluginProps={{}} placeholder="Enter Descriptor" />
    </div>,
  );
  const get = (id: string) => view.getByTestId(id);

  get('clip').getBoundingClientRect = () => rect(100, 500); // visible area: 100 -> 600
  get('anchor').getBoundingClientRect = () => rect(anchorLeft, 180);
  Object.defineProperty(get('toolbar'), 'offsetWidth', { configurable: true, value: toolbarWidth });

  const offset = () => (get('anchor').closest('[style*="--toolbar-offset"]') as HTMLElement).style.getPropertyValue('--toolbar-offset');

  return { focus: () => fireEvent.focus(get('editable')), offset, view };
};

describe('toolbar stays inside the scrolling area', () => {
  afterEach(cleanup);

  it('does not move a toolbar that already fits', () => {
    const { focus, offset } = setup({ anchorLeft: 200 }); // 200 + 290 <= 600

    focus();

    expect(offset()).toBe('0px');
  });

  it('pulls the toolbar back by how far it would run past the right edge', () => {
    const { focus, offset } = setup({ anchorLeft: 500 }); // would end at 790, so move 190 left

    focus();

    expect(offset()).toBe('-190px');
  });

  it('works for an editor that is itself partly past the right edge', () => {
    const { focus, offset } = setup({ anchorLeft: 580 });

    focus();

    expect(offset()).toBe('-270px');
  });

  it('never pushes the toolbar past the left edge', () => {
    const { focus, offset } = setup({ anchorLeft: 120, toolbarWidth: 520 }); // wider than the area

    focus();

    expect(offset()).toBe('-20px'); // stops at the left edge (100)
  });
});
