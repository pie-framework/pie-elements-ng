import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('../src/components/respArea/DragInTheBlank/DragInTheBlank.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/ExplicitConstructedResponse.js', () => ({ default: () => null }));

const { EditableHtml } = await import('../src/components/EditableHtml');

/** An editor holding `markup`, with the caret in its first empty `div`. */
const setup = async (markup: string) => {
  let tiptap: any;
  render(
    <EditableHtml
      markup={markup}
      onChange={vi.fn()}
      activePlugins={['bulleted-list', 'numbered-list']}
      editorRef={(instance: unknown) => {
        tiptap = instance;
      }}
    />,
  );
  const box = await waitFor(() => screen.getByRole('textbox'));
  act(() => box.focus());

  let caret = -1;
  tiptap.state.doc.descendants((node: any, pos: number) => {
    if (caret === -1 && node.type.name === 'div' && node.content.size === 0) caret = pos + 1;
  });
  act(() => {
    tiptap.commands.setTextSelection(caret);
  });
  return tiptap;
};

const press = (key: string) => act(() => fireEvent.keyDown(screen.getByRole('textbox'), { key }));

describe.each(['ul', 'ol'])('an empty last item of a %s', (list) => {
  const markup = `<${list}><li><div>1</div></li><li><div>2</div></li><li><div></div></li></${list}>`;
  const listed = `<${list}><li><div>1</div></li><li><div>2</div></li></${list}>`;

  it('leaves the list on Backspace, keeping the caret on the line it was on', async () => {
    const tiptap = await setup(markup);

    press('Backspace');

    expect(tiptap.getHTML().startsWith(`${listed}<div></div>`)).toBe(true);
    expect(tiptap.state.selection.$from.depth).toBe(1);
    expect(tiptap.state.selection.$from.parent.type.name).toBe('div');
  });

  it('leaves the list the same way on Enter', async () => {
    const tiptap = await setup(markup);

    press('Enter');

    expect(tiptap.getHTML().startsWith(`${listed}<div></div>`)).toBe(true);
    expect(tiptap.state.selection.$from.depth).toBe(1);
  });
});
