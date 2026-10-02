// Runs both copies of the extension: root vitest, which CI runs, excludes packages/lib-react, so
// the React editor's copy has no other test that CI sees. Its registration in `EditableHtml.tsx`
// is pinned by tools/cli/tests/sync-presets.test.ts.
import { Editor, Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlainTextPaste as ReactPlainTextPaste } from '../../../lib-react/editable-html-tip-tap/src/plain-text-paste';
import { PlainTextPaste as SveltePlainTextPaste } from '../src/plain-text-paste';

// The text/html and text/plain flavours Word puts on the clipboard, minus the <html> document
// wrapper, which happy-dom's innerHTML drops everything inside.
const WORD_HTML =
  `<!--StartFragment--><p class=MsoNormal style='text-align:center'><span style='font-size:14.0pt;` +
  `font-family:"Calibri",sans-serif;color:#C00000'>Read the <b>passage</b>.<o:p></o:p></span></p>` +
  `<p class=MsoNormal><span class=SpellE style='font-family:Arial'>Second</span> line</p><!--EndFragment-->`;
const WORD_TEXT = 'Read the passage.\r\nSecond line';

const editors: Editor[] = [];

function paste(editor: Editor, flavours: Record<string, string>, files: File[] = []) {
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

const png = () => new File(['png'], 'image.png', { type: 'image/png' });

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
  document.body.innerHTML = '';
});

describe.each([
  ['React', ReactPlainTextPaste],
  ['Svelte', SveltePlainTextPaste],
])('PlainTextPaste (%s editor)', (_name, PlainTextPaste) => {
  /** An editor whose lowest-priority paste handler records what reaches it, as ImageUploadNode's would. */
  function createEditor(content = '') {
    const reachedImageHandler = vi.fn(() => true);
    const editor = new Editor({
      element: document.body.appendChild(document.createElement('div')),
      content,
      extensions: [
        StarterKit,
        TextStyleKit,
        TextAlign.configure({ types: ['paragraph'] }),
        PlainTextPaste,
        Extension.create({
          name: 'imageHandler',
          addProseMirrorPlugins: () => [
            new Plugin({
              props: {
                handlePaste: (_view, event) =>
                  Array.from(event.clipboardData?.items ?? []).some((item) => item.kind === 'file')
                    ? reachedImageHandler()
                    : false,
              },
            }),
          ],
        }),
      ],
    });
    editors.push(editor);
    return { editor, reachedImageHandler };
  }

  it('pastes Word content as plain text, one paragraph per line', () => {
    const { editor } = createEditor();

    paste(editor, { 'text/html': WORD_HTML, 'text/plain': WORD_TEXT, 'text/rtf': '{\\rtf1 }' });

    expect(editor.getHTML()).toBe('<p>Read the passage.</p><p>Second line</p>');
  });

  it('keeps the formatting of content copied from a PIE editor', () => {
    const { editor } = createEditor();

    paste(editor, {
      'text/html': '<p data-pm-slice="1 1 []">Copied <strong>bold</strong></p>',
      'text/plain': 'Copied bold',
    });

    expect(editor.getHTML()).toBe('<p>Copied <strong>bold</strong></p>');
  });

  it('leaves a pasted image to the image handler', () => {
    const { reachedImageHandler, editor } = createEditor();

    paste(editor, { 'text/html': '<img src="https://example.com/a.png">' }, [png()]);

    expect(reachedImageHandler).toHaveBeenCalledTimes(1);
  });

  it('pastes the text, not the picture of it, when Word puts both on the clipboard', () => {
    const { editor, reachedImageHandler } = createEditor();

    paste(editor, { 'text/html': WORD_HTML, 'text/plain': WORD_TEXT, 'text/rtf': '{\\rtf1 }' }, [
      png(),
    ]);

    expect(reachedImageHandler).not.toHaveBeenCalled();
    expect(editor.getHTML()).toBe('<p>Read the passage.</p><p>Second line</p>');
  });

  it('leaves a picture copied from Word, which has no text, to the image handler', () => {
    const { editor, reachedImageHandler } = createEditor();

    paste(
      editor,
      {
        'text/html': '<img src="file:///clip_image001.png">',
        'text/plain': ' ',
        'text/rtf': '{\\rtf1 }',
      },
      [png()]
    );

    expect(reachedImageHandler).toHaveBeenCalledTimes(1);
  });

  it('leaves a plain-text paste as it was', () => {
    const { editor } = createEditor();

    paste(editor, { 'text/plain': 'First\nSecond' });

    expect(editor.getHTML()).toBe('<p>First</p><p>Second</p>');
  });
});
