// @vitest-environment happy-dom
import { getSchema } from '@tiptap/core';
import { EditorState, NodeSelection, TextSelection } from '@tiptap/pm/state';
import { EditorView } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { MathNode, ZeroWidthSpaceHandlingPlugin } from '../src/extensions/math';

const ZERO_WIDTH_SPACE = String.fromCharCode(0x200b);
const schema = getSchema([StarterKit, MathNode]);

// A live view's DOM observer flushes on a timer, which would otherwise outlive the test environment.
const views: EditorView[] = [];

/** A paragraph of `ab`, a math node at position 3, and the zero-width space after it, with the caret last. */
const mountAfterMath = (direction: 'ltr' | 'rtl') => {
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [
      schema.text('ab'),
      schema.nodes.math.create(),
      schema.text(ZERO_WIDTH_SPACE),
    ]),
  ]);
  const state = EditorState.create({ doc, plugins: [ZeroWidthSpaceHandlingPlugin] });
  const mount = document.createElement('div');
  mount.style.direction = direction;
  document.body.append(mount);
  const view = new EditorView(mount, {
    state: state.apply(state.tr.setSelection(TextSelection.atEnd(doc))),
  });
  view.dom.querySelector('p')?.style.setProperty('direction', direction);
  views.push(view);
  return view;
};

const press = (view: EditorView, key: string) =>
  view.someProp('handleKeyDown', (handle) => handle(view, new KeyboardEvent('keydown', { key })));

afterEach(() => {
  for (const view of views.splice(0)) view.destroy();
  document.body.replaceChildren();
});

describe('arrow keys after a math node', () => {
  it('ArrowLeft selects the math node in left-to-right text', () => {
    const view = mountAfterMath('ltr');
    expect(press(view, 'ArrowLeft')).toBe(true);
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    expect(view.state.selection.from).toBe(3);
  });

  it('ArrowRight selects the math node in right-to-left text', () => {
    const view = mountAfterMath('rtl');
    expect(press(view, 'ArrowRight')).toBe(true);
    expect(view.state.selection).toBeInstanceOf(NodeSelection);
    expect(view.state.selection.from).toBe(3);
  });

  it('ArrowLeft is left to the editor in right-to-left text', () => {
    const view = mountAfterMath('rtl');
    expect(press(view, 'ArrowLeft')).toBeFalsy();
    expect(view.state.selection).not.toBeInstanceOf(NodeSelection);
  });
});
