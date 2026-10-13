// @vitest-environment happy-dom
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/components/respArea/ExplicitConstructedResponse.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/DragInTheBlank/DragInTheBlank.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/InlineDropdown.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/MathTemplated.js', () => ({ default: () => null }));

import { ExplicitConstructedResponseNode, ResponseAreaExtension } from '../src/extensions/responseArea';

const TYPE = 'explicit-constructed-response';
const area = (index: number) =>
  `<span data-type="explicit_constructed_response" data-index="${index}" data-value=""></span>`;
const markup = (indices: number[]) => `<p>x ${indices.map(area).join(' ')}</p>`;

const editors: Editor[] = [];

const createEditor = (content: string) => {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: [
      StarterKit,
      ResponseAreaExtension.configure({ type: TYPE, maxResponseAreas: 20 }),
      ExplicitConstructedResponseNode.configure({ type: TYPE }),
    ],
    content,
  });
  editors.push(editor);
  return editor;
};

const indicesOf = (editor: Editor) => {
  const indices: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.name === 'explicit_constructed_response') indices.push(node.attrs.index);
  });
  return indices.sort((a, b) => Number(a) - Number(b));
};

const insert = (editor: Editor) => editor.chain().insertResponseArea(TYPE).run();

describe('response area index', () => {
  afterEach(() => {
    while (editors.length) editors.pop()?.destroy();
  });

  it('numbers an insert from its own editor when an editor of the same type opened first', () => {
    createEditor(markup([0, 1, 2]));
    const second = createEditor(markup([0, 1, 2, 3, 4, 5]));

    insert(second);

    expect(indicesOf(second)).toEqual(['0', '1', '2', '3', '4', '5', '6']);
  });

  it('numbers an insert after the content the editor was given later', () => {
    const editor = createEditor(markup([0, 1, 2]));
    editor.commands.setContent(markup([0, 1, 2, 3, 4, 5]));

    insert(editor);

    expect(indicesOf(editor)).toEqual(['0', '1', '2', '3', '4', '5', '6']);
  });

  it('gives each insert the highest index the editor has seen plus one', () => {
    const editor = createEditor(markup([0, 1, 2]));

    expect(editor.can().insertResponseArea(TYPE)).toBe(true);
    insert(editor);
    insert(editor);
    expect(indicesOf(editor)).toEqual(['0', '1', '2', '3', '4']);

    // Deleting the newest area does not free its index for the next insert.
    editor.state.doc.descendants((node, pos) => {
      if (node.attrs.index === '4') editor.commands.deleteRange({ from: pos, to: pos + node.nodeSize });
    });
    expect(indicesOf(editor)).toEqual(['0', '1', '2', '3']);
    insert(editor);
    expect(indicesOf(editor)).toEqual(['0', '1', '2', '3', '5']);
  });

  it('starts an empty editor at index 1', () => {
    const editor = createEditor('<p>x</p>');

    insert(editor);

    expect(indicesOf(editor)).toEqual(['1']);
  });
});
