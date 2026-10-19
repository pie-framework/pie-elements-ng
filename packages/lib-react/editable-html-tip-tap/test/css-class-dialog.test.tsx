import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CSSMark } from '../src/extensions/css';

let editor: Editor;
let addListener: ReturnType<typeof vi.spyOn>;
let removeListener: ReturnType<typeof vi.spyOn>;

// Click listeners the dialogs have added to <body> and not yet removed.
const bodyClickListeners = () => {
  const removed = removeListener.mock.calls.filter(([type]) => type === 'click').map(([, fn]) => fn);
  return addListener.mock.calls.filter(([type, fn]) => type === 'click' && !removed.includes(fn));
};

const openDialog = () => act(() => editor.commands.openCSSClassDialog());

beforeEach(() => {
  // The dialog positions itself in the editor element's great-grandparent.
  const element = document.createElement('div');
  document.body.appendChild(document.createElement('div')).appendChild(document.createElement('div')).appendChild(
    document.createElement('div'),
  ).appendChild(element);

  editor = new Editor({
    element,
    extensions: [StarterKit, CSSMark.configure({ extraCSSRules: { names: ['red', 'blue'] } })],
    content: '<p>hello</p>',
  });
  editor.commands.setTextSelection({ from: 1, to: 6 });

  addListener = vi.spyOn(document.body, 'addEventListener');
  removeListener = vi.spyOn(document.body, 'removeEventListener');
});

afterEach(() => {
  vi.restoreAllMocks();
  editor.destroy();
  document.body.innerHTML = '';
});

describe('CSS class dialog', () => {
  it('applies the chosen class and removes its body click listener', () => {
    openDialog();
    fireEvent.click(screen.getByText('blue'));

    expect(editor.getHTML()).toBe('<p><span class="blue">hello</span></p>');
    expect(screen.queryByText('Please choose a css class')).toBeNull();
    expect(bodyClickListeners()).toEqual([]);
  });

  it('tears down the dialog that a second one replaces', () => {
    openDialog();
    openDialog();

    expect(screen.getAllByText('Please choose a css class')).toHaveLength(1);
    expect(bodyClickListeners()).toHaveLength(1);

    fireEvent.click(screen.getByText('red'));

    expect(editor.getHTML()).toBe('<p><span class="red">hello</span></p>');
    expect(bodyClickListeners()).toEqual([]);
  });
});
