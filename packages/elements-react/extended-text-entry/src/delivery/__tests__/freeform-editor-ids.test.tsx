import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

import FreeformEditorImport from '../annotation/freeform-editor';

// freeform-editor.tsx is untyped, so its class declares no props.
const FreeformEditor = FreeformEditorImport as unknown as React.ComponentType<Record<string, unknown>>;

const anchor = () => {
  const el = document.createElement('span');
  document.body.appendChild(el);
  return el;
};

// Two items on one page, each with its annotation editor open.
const editor = (anchorEl: HTMLElement, value: string) => (
  <FreeformEditor
    anchorEl={anchorEl}
    open
    offset={0}
    value={value}
    type="positive"
    onClose={vi.fn()}
    onDelete={vi.fn()}
    onSave={vi.fn()}
    onTypeChange={vi.fn()}
  />
);

const editorInputs = () => [...document.querySelectorAll<HTMLTextAreaElement>('textarea[id]')];

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

describe('extended-text-entry annotation editor', () => {
  it('gives each open editor its own input id', () => {
    render(editor(anchor(), 'First'));
    render(editor(anchor(), 'Second'));

    const ids = [...document.querySelectorAll('[id]')].map((el) => el.id);
    expect(editorInputs()).toHaveLength(2);
    expect(editorInputs().map((input) => input.id)).toEqual([
      expect.stringMatching(/^annotation-editor-/),
      expect.stringMatching(/^annotation-editor-/),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps its input id when the annotation text changes', () => {
    const anchorEl = anchor();
    const { rerender } = render(editor(anchorEl, 'First'));
    const [before] = editorInputs().map((input) => input.id);

    rerender(editor(anchorEl, 'Edited'));

    expect(editorInputs().map((input) => input.id)).toEqual([before]);
  });
});
