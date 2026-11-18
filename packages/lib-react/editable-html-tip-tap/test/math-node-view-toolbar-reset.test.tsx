// @vitest-environment happy-dom
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';

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
      isEditable: true,
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

  it('moves the toolbar to stay beside the node as the node grows while typing', async () => {
    const observers = [];

    vi.stubGlobal(
      'ResizeObserver',
      class {
        observed = [];
        constructor(callback) {
          this.callback = callback;
          observers.push(this);
        }
        observe(el) {
          this.observed.push(el);
        }
        disconnect() {}
      },
    );

    const editor = {
      _toolbarOpened: false,
      isDestroyed: false,
      isEditable: true,
      instanceId: 'editor-1',
      state: { selection: { node: { type: { name: 'math' } }, from: 0 }, doc: {} },
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

    try {
      const { container, unmount } = render(<MathNodeView {...props} />);

      const toolbar = await waitFor(() => {
        const el = document.querySelector('[data-toolbar-for="editor-1"]');
        expect(el).not.toBeNull();
        return el;
      });

      const nodeEl = container.querySelector('[contenteditable="false"]');
      const observer = observers.find((o) => o.observed.includes(nodeEl));
      expect(observer).toBeDefined();

      const setNodeWidth = (width) => {
        nodeEl.getBoundingClientRect = () =>
          ({ top: 100, bottom: 120, left: 300, right: 300 + width, width, height: 20 }) as DOMRect;
        observer.callback([]);
      };

      setNodeWidth(60);
      await waitFor(() => expect(toolbar.style.left).toBe('360px'));

      setNodeWidth(200);
      await waitFor(() => expect(toolbar.style.left).toBe('500px'));

      unmount();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('opens no toolbar in a read-only editor, from a click or from the selection a click makes', () => {
    const editor = {
      _toolbarOpened: false,
      isDestroyed: false,
      isEditable: false,
      instanceId: 'read-only',
      state: { selection: { node: { type: { name: 'math' } }, from: 0 }, doc: {} },
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
      selected: false,
      options: {},
      getPos: () => 0,
    };

    const { container, rerender, unmount } = render(<MathNodeView {...props} />);

    fireEvent.click(container.querySelector('[contenteditable="false"]'));
    rerender(<MathNodeView {...props} selected />);

    expect(document.querySelector('[data-toolbar-for="read-only"]')).toBeNull();
    unmount();
  });
});
