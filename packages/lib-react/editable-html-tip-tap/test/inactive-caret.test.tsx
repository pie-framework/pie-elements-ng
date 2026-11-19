import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

const mount = async (markup = '<div>AC</div>') => {
  let instance: any;
  const view = render(
    <div>
      <EditableHtml
        markup={markup}
        onChange={vi.fn()}
        activePlugins={['bold']}
        editorRef={(e: any) => (instance = e || instance)}
      />
      <button type="button" data-testid="elsewhere">
        other
      </button>
    </div>,
  );
  await vi.waitFor(() => expect(instance).toBeTruthy());
  const { container } = view;
  const editable = container.querySelector<HTMLElement>('.ProseMirror')!;
  const toolbarButton = () => container.querySelector<HTMLButtonElement>('[data-editor-toolbar] button')!;

  return {
    ...view,
    editor: instance,
    editable,
    toolbarButton,
    elsewhere: container.querySelector<HTMLButtonElement>('[data-testid="elsewhere"]')!,
    carets: () => container.querySelectorAll('.pie-inactive-caret'),
  };
};

// jsdom has no layout, so the view cannot measure a position.
const measure = (editor: any) => {
  const coordsAtPos = vi.fn(() => ({ left: 30, right: 30, top: 12, bottom: 30 }));
  editor.view.coordsAtPos = coordsAtPos;
  return coordsAtPos;
};

const placeCursorBetween = (editor: any) => {
  measure(editor);
  act(() => void editor.commands.setTextSelection(2));
};

describe('text cursor while the formatting toolbar has focus', () => {
  it('shows a caret at the insertion point, and removes it when focus moves elsewhere', async () => {
    const { editor, editable, toolbarButton, elsewhere, carets } = await mount();

    act(() => editable.focus());
    placeCursorBetween(editor);
    await settle();
    expect(carets()).toHaveLength(0);

    act(() => toolbarButton().focus());
    await settle();
    expect(carets()).toHaveLength(1);
    expect(carets()[0].getAttribute('aria-hidden')).toBe('true');

    // At the position between the "A" and the "C", as tall as the line.
    expect(editor.view.coordsAtPos).toHaveBeenCalledWith(2);
    expect((carets()[0] as HTMLElement).style.height).toBe('18px');

    act(() => elsewhere.focus());
    await settle();
    expect(carets()).toHaveLength(0);
  });

  it('removes the caret when the text is refocused', async () => {
    const { editor, editable, toolbarButton, carets } = await mount();

    act(() => editable.focus());
    placeCursorBetween(editor);
    act(() => toolbarButton().focus());
    await settle();
    expect(carets()).toHaveLength(1);

    act(() => editable.focus());
    await settle();
    expect(carets()).toHaveLength(0);
  });

  it('shows no caret when focus leaves the text for something other than the toolbar', async () => {
    const { editor, editable, elsewhere, carets } = await mount();

    act(() => editable.focus());
    placeCursorBetween(editor);
    act(() => elsewhere.focus());
    await settle();

    expect(carets()).toHaveLength(0);
  });

  it('shows a caret again on a second trip to the toolbar', async () => {
    const { editor, editable, toolbarButton, elsewhere, carets } = await mount();

    act(() => editable.focus());
    placeCursorBetween(editor);
    act(() => toolbarButton().focus());
    act(() => elsewhere.focus());
    await settle();
    act(() => editable.focus());
    act(() => toolbarButton().focus());
    await settle();

    expect(carets()).toHaveLength(1);
  });

  it('draws no caret for a range selection', async () => {
    const { editor, editable, toolbarButton, carets } = await mount();

    measure(editor);
    act(() => editable.focus());
    act(() => void editor.commands.setTextSelection({ from: 1, to: 3 }));
    act(() => toolbarButton().focus());
    await settle();

    expect(carets()).toHaveLength(0);
  });

  it('leaves the saved content untouched', async () => {
    const { editor, editable, toolbarButton } = await mount();

    act(() => editable.focus());
    placeCursorBetween(editor);
    act(() => toolbarButton().focus());
    await settle();

    expect(editor.getHTML()).toBe('<div>AC</div>');
  });

  it('survives unmounting while the caret is shown', async () => {
    const { editor, editable, toolbarButton, unmount } = await mount();

    act(() => editable.focus());
    placeCursorBetween(editor);
    act(() => toolbarButton().focus());
    await settle();

    expect(() => unmount()).not.toThrow();
  });
});
