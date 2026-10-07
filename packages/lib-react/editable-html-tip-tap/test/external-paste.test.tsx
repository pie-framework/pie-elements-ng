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

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// As Word for Mac copies a picture in a paragraph: VML for Office, an `<img>` for everything else.
const PICTURE = {
  'text/html':
    '<p class=MsoNormal>Label the diagram.</p>' +
    '<p class=MsoNormal><span style="mso-no-proof:yes"><!--[if gte vml 1]><v:shape id="_x0000_i1027" ' +
    'style="width:259pt;height:79pt"><v:imagedata src="file:///tmp/msohtmlclip/clip_image001.png"/>' +
    `</v:shape><![endif]--><![if !vml]><img width=259 height=79 src="${PNG}" v:shapes="_x0000_i1027">` +
    '<![endif]></span></p><p class=MsoNormal>Drag each label.</p>',
  'text/plain': 'Label the diagram.\n\nDrag each label.',
  'text/rtf': '{\\rtf1}',
};

// The picture of the copied text that Word puts on the clipboard beside it.
const textPicture = () => new File([new Uint8Array([1])], 'image.png', { type: 'image/png' });

const pictures = (editor: any) => {
  const found: any[] = [];
  editor.state.doc.descendants((node: any) => {
    if (node.type.name === 'imageUploadNode') found.push(node.attrs);
  });
  return found;
};

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

function paste(editor: any, flavours: Record<string, string>, files: File[] = []) {
  const clipboardData = {
    types: [...Object.keys(flavours), ...(files.length ? ['Files'] : [])],
    items: [
      ...Object.keys(flavours).map((type) => ({ kind: 'string', type })),
      ...files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
    ],
    files,
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

  it("pastes Word's blank lines without the formatting around them", async () => {
    const { editor } = await mountEditor();

    paste(editor, {
      'text/html': '<p><b>Bold</b></p><p><b><span>&nbsp;</span></b></p><p>and <i>italic</i></p>',
      'text/plain': 'Bold\n\nand italic',
    });

    expect(editor.getHTML()).toBe('<div><strong>Bold</strong></div><p>&nbsp;</p><p>and <em>italic</em></p>');
  });

  it('follows a change of toolbar', async () => {
    const { editor, rerender } = await mountEditor({ activePlugins: ['bold'] });

    rerender({ activePlugins: ['italic'] });
    paste(editor, { 'text/html': '<p><b>Bold</b> <i>italic</i></p>', 'text/plain': 'Bold italic' });

    expect(editor.getHTML()).toBe('<div>Bold <em>italic</em></div>');
  });
});

describe('EditableHtml pasted pictures', () => {
  const upload = () => ({ add: vi.fn(), delete: vi.fn() });

  it("uploads Word's picture through the host, as a pasted image file", async () => {
    const imageSupport = upload();
    const { editor } = await mountEditor({ imageSupport });

    paste(editor, PICTURE, [textPicture()]);

    expect(pictures(editor)).toEqual([
      expect.objectContaining({ src: PNG, width: 259, height: 79, loaded: false, nodeKey: expect.any(String) }),
    ]);
    expect(editor.getText({ blockSeparator: '|' })).toBe('Label the diagram.||Drag each label.');
    expect(imageSupport.add).toHaveBeenCalledTimes(1);

    const handler = imageSupport.add.mock.calls[0][0];
    expect(handler.isPasted).toBe(true);
    expect(handler.getChosenFile()).toMatchObject({ name: 'image.png', type: 'image/png', size: 68 });

    handler.done(null, 'https://cdn.example.com/diagram.png');

    expect(pictures(editor)).toEqual([
      expect.objectContaining({ src: 'https://cdn.example.com/diagram.png', loaded: true }),
    ]);
  });

  it('drops the picture in an editor with no image upload', async () => {
    const { editor } = await mountEditor();

    paste(editor, PICTURE, [textPicture()]);

    expect(pictures(editor)).toEqual([]);
    expect(editor.getHTML()).not.toContain('<img');
  });

  it('drops the picture when the toolbar has no image button', async () => {
    const imageSupport = upload();
    const { editor } = await mountEditor({ activePlugins: ['bold'], imageSupport });

    paste(editor, PICTURE, [textPicture()]);

    expect(pictures(editor)).toEqual([]);
    expect(imageSupport.add).not.toHaveBeenCalled();
  });

  it('drops a picture that is a link to another site', async () => {
    const imageSupport = upload();
    const { editor } = await mountEditor({ imageSupport });

    paste(editor, {
      'text/html': '<p>Before</p><p><img src="https://example.com/diagram.png"></p><p>After</p>',
      'text/plain': 'Before\nAfter',
    });

    expect(editor.getHTML()).not.toContain('<img');
    expect(imageSupport.add).not.toHaveBeenCalled();
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
