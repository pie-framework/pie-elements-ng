import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on pasting.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const FORMATTED = {
  'text/html':
    '<p style="color:red;text-align:center"><b>Bold</b>, <i>italic</i>, <u>underlined</u>, <s>struck</s>, ' +
    'H<sub>2</sub>O and x<sup>2</sup></p><ol type="a"><li>Item</li></ol>',
  'text/plain': 'Bold, italic, underlined, struck, H2O and x2\na. Item',
};

const TABLE =
  '<table><caption>Prices</caption><tbody><tr><th scope="col">Item</th><th scope="col">Cost</th></tr>' +
  '<tr><th scope="row">Pen</th><td>$1</td></tr></tbody></table>';

const element = (props: Record<string, unknown>, onEditor: (editor: any) => void) => (
  <EditableHtml markup="" onChange={vi.fn()} editorRef={onEditor} {...props} />
);

async function mountEditor(props: Record<string, unknown> = {}) {
  let editor: any;
  const onEditor = (instance: any) => {
    editor = instance;
  };
  const { container, rerender } = render(element(props, onEditor));
  await waitFor(() => expect(editor?.view.dom.isConnected).toBe(true));

  return {
    editor,
    container,
    rerender: (next: Record<string, unknown>) => rerender(element(next, onEditor)),
  };
}

function paste(editor: any, flavours: Record<string, string>) {
  const clipboardData = {
    types: Object.keys(flavours),
    items: Object.keys(flavours).map((type) => ({ kind: 'string', type })),
    files: [],
    getData: (type: string) => flavours[type] ?? '',
  };
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: clipboardData });
  editor.view.dom.dispatchEvent(event);
}

describe('EditableHtml paste', () => {
  it('keeps the formatting the toolbar offers, and drops colours and alignment', async () => {
    const { editor } = await mountEditor();

    paste(editor, FORMATTED);

    // The trailing node adds an empty paragraph after a list that ends the document.
    expect(editor.getHTML()).toBe(
      '<div><strong>Bold</strong>, <em>italic</em>, <u>underlined</u>, <s>struck</s>, H<sub>2</sub>O and ' +
        'x<sup>2</sup></div><ol type="a"><li><div>Item</div></li></ol><p></p>',
    );
  });

  it('keeps only the formatting the toolbar offers', async () => {
    const { editor } = await mountEditor({ activePlugins: ['italic', 'superscript'] });

    paste(editor, FORMATTED);

    expect(editor.getHTML()).toBe(
      '<div>Bold, <em>italic</em>, underlined, struck, H2O and x<sup>2</sup></div><p>a. Item</p>',
    );
  });

  it('keeps no formatting whose toolbar button the host disables', async () => {
    const { editor } = await mountEditor({
      pluginProps: { bold: { disabled: true }, ol_list: { disabled: true } },
    });

    paste(editor, FORMATTED);

    expect(editor.getHTML()).toBe(
      '<div>Bold, <em>italic</em>, <u>underlined</u>, <s>struck</s>, H<sub>2</sub>O and x<sup>2</sup></div>' +
        '<p>a. Item</p>',
    );
  });

  it('pastes plain text when the host disables paste formatting', async () => {
    const { editor } = await mountEditor({ pluginProps: { pasteFormatting: { disabled: true } } });

    paste(editor, FORMATTED);

    expect(editor.getHTML()).toBe('<div>Bold, italic, underlined, struck, H2O and x2</div><p>a. Item</p>');
  });

  it('follows a change of toolbar', async () => {
    const { editor, rerender } = await mountEditor({ activePlugins: ['bold'] });

    rerender({ activePlugins: ['italic'] });
    paste(editor, { 'text/html': '<p><b>Bold</b> <i>italic</i></p>', 'text/plain': 'Bold italic' });

    expect(editor.getHTML()).toBe('<div>Bold <em>italic</em></div>');
  });
});

describe('EditableHtml tables', () => {
  it("keeps a table's caption and header scopes", async () => {
    const { editor } = await mountEditor({ markup: TABLE });
    const html = editor.getHTML();

    expect(html).toMatch(/^<table[^>]*><caption>Prices<\/caption><colgroup>/);
    expect(html.match(/<th[^>]*>/g)?.map((cell: string) => /scope="(\w+)"/.exec(cell)?.[1])).toEqual([
      'col',
      'col',
      'row',
    ]);
  });

  it('shows the caption above the table, outside the text the author edits', async () => {
    const { container } = await mountEditor({ markup: TABLE });
    const caption = container.querySelector('.ProseMirror table > caption');

    expect(caption?.textContent).toBe('Prices');
    expect(caption?.getAttribute('contenteditable')).toBe('false');
    expect(caption?.parentElement?.firstElementChild).toBe(caption);
  });

  it("keeps a pasted table's caption and header scopes", async () => {
    const { editor } = await mountEditor();

    paste(editor, {
      'text/html': TABLE.replace('<table>', '<table style="width:100%">'),
      'text/plain': 'Prices\nItem\tCost\nPen\t$1',
    });

    const html = editor.getHTML();
    expect(html).toContain('<caption>Prices</caption>');
    expect(html.match(/scope="(col|row)"/g)).toEqual(['scope="col"', 'scope="col"', 'scope="row"']);
    expect(html).not.toContain('100%');
  });
});
