// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));
vi.mock('@tiptap/react', () => ({
  NodeViewWrapper: ({ children }) => <div>{children}</div>,
  ReactNodeViewRenderer: (component) => component,
}));

import { MathNodeView } from '../src/extensions/math';

describe('MathNodeView', () => {
  it('resets editor._toolbarOpened when the node view unmounts while selected (select-all + delete)', async () => {
    const editor = {
      _toolbarOpened: false,
      isDestroyed: false,
      state: { selection: { node: { type: { name: 'math' } } }, doc: {} },
      view: {
        dom: document.createElement('div'),
        coordsAtPos: () => ({ top: 0, left: 0, bottom: 0, right: 0 }),
      },
      commands: { focus: vi.fn() },
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    const props = {
      node: { attrs: { latex: 'x', wrapper: null }, nodeSize: 1 },
      updateAttributes: vi.fn(),
      editor,
      selected: true,
      options: {},
      getPos: () => 0,
    };

    const { unmount } = render(<MathNodeView {...props} />);
    await waitFor(() => expect(editor._toolbarOpened).toBe(true));

    unmount();

    expect(editor._toolbarOpened).toBe(false);
  });
});
