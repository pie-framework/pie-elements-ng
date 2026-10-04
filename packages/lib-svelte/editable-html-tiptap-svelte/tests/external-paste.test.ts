// Runs both copies of the extension, which differ only in their comments, against the same cases.
import { type AnyExtension, Editor, Extension, Node } from '@tiptap/core';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableRow } from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import { Plugin } from '@tiptap/pm/state';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type ExternalPasteSettings,
  ExternalPaste as ReactExternalPaste,
} from '../../../lib-react/editable-html-tip-tap/src/external-paste';
import { ExternalPaste as SvelteExternalPaste } from '../src/external-paste';
import { SemanticTable, SemanticTableHeader } from '../src/semantic-table';

// Word's clipboard HTML is a whole document; these are the fragments inside its <body>, since
// happy-dom's innerHTML drops everything inside an <html> element.
const WORD_HTML =
  `<!--StartFragment--><p class=MsoNormal style='text-align:center'><span style='font-size:14.0pt;` +
  `font-family:"Calibri",sans-serif;color:#C00000'>Read the <b>passage</b>.<o:p></o:p></span></p>` +
  `<p class=MsoNormal><span class=SpellE style='font-family:Arial'>Second</span> line</p><!--EndFragment-->`;
const WORD_TEXT = 'Read the passage.\r\nSecond line';
const WORD = { 'text/html': WORD_HTML, 'text/plain': WORD_TEXT, 'text/rtf': '{\\rtf1 }' };

// Word for Windows: conditional markers in its downlevel-revealed form, tags wrapped across lines.
const WORD_WINDOWS_MARKS = [
  `<p class=MsoNormal style='text-align:center'><b><span style='font-size:14.0pt;font-family:"Calibri",sans-serif;`,
  `color:#C00000'>Bold</span></b><span style='color:#C00000'> and <i>italic</i>, <u>underlined</u>, <s>struck</s>,`,
  `H<sub>2</sub>O and x<sup>2</sup>.<o:p></o:p></span></p>`,
  `<p class=MsoNormal><o:p>&nbsp;</o:p></p>`,
  `<p class=MsoNormal>Line one<br>`,
  `Line two<o:p></o:p></p>`,
].join('\r\n');

const WORD_WINDOWS_LIST = [
  `<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span`,
  `style='font-family:Symbol'><span style='mso-list:Ignore'>·<span`,
  `style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`,
  `</span></span></span><![endif]>First <b>bullet</b><o:p></o:p></p>`,
  `<p class=MsoListParagraphCxSpMiddle style='margin-left:1.0in;mso-add-space:auto;`,
  `text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span`,
  `style='font-family:"Courier New"'><span style='mso-list:Ignore'>o<span`,
  `style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><![endif]>Nested<o:p></o:p></p>`,
  `<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span`,
  `style='font-family:Symbol'><span style='mso-list:Ignore'>·<span`,
  `style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`,
  `</span></span></span><![endif]>Second<o:p></o:p></p>`,
].join('\r\n');

// Word for Mac: conditional markers as comments, a list continuing at 3, a roman third level right-
// aligned with a tab span.
const WORD_MAC_LIST = [
  `<p class=MsoListParagraphCxSpFirst style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><!--[if !supportLists]--><span`,
  `lang=EN-US><span style='mso-list:Ignore'>3.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`,
  `</span></span></span><!--[endif]--><span lang=EN-US>Third<o:p></o:p></span></p>`,
  `<p class=MsoListParagraphCxSpMiddle style='margin-left:72.0pt;mso-add-space:auto;text-indent:-18.0pt;mso-list:l1 level2 lfo2'><!--[if !supportLists]--><span`,
  `lang=EN-US><span style='mso-list:Ignore'>a.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`,
  `</span></span></span><!--[endif]--><span lang=EN-US>Sub-item<o:p></o:p></span></p>`,
  `<p class=MsoListParagraphCxSpMiddle style='margin-left:108.0pt;mso-add-space:auto;text-indent:-108.0pt;mso-text-indent-alt:-9.0pt;mso-list:l1 level3 lfo2'><!--[if !supportLists]--><span`,
  `lang=EN-US><span style='mso-list:Ignore'><span style='mso-tab-count:7'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span>i.<span`,
  `style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp; </span></span></span><!--[endif]--><span lang=EN-US>Roman<o:p></o:p></span></p>`,
  `<p class=MsoListParagraphCxSpLast style='text-indent:-18.0pt;mso-list:l1 level1 lfo2'><!--[if !supportLists]--><span`,
  `lang=EN-US><span style='mso-list:Ignore'>4.<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`,
  `</span></span></span><!--[endif]--><span lang=EN-US>Fourth<o:p></o:p></span></p>`,
].join('\r\n');

const WORD_TABLE = [
  `<table class=MsoTableGrid border=1 cellspacing=0 cellpadding=0`,
  ` style='border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt;`,
  ` mso-yfti-tbllook:1184;mso-padding-alt:0in 5.4pt 0in 5.4pt'>`,
  ` <tr style='mso-yfti-irow:0;mso-yfti-firstrow:yes'>`,
  `  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt;padding:0in 5.4pt 0in 5.4pt'>`,
  `  <p class=MsoNormal><b>Fruit<o:p></o:p></b></p>`,
  `  </td>`,
  `  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt;border-left:none'>`,
  `  <p class=MsoNormal><b>Price<o:p></o:p></b></p>`,
  `  </td>`,
  ` </tr>`,
  ` <tr style='mso-yfti-irow:1;mso-yfti-lastrow:yes'>`,
  `  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt;border-top:none'>`,
  `  <p class=MsoNormal>Apple<o:p></o:p></p>`,
  `  </td>`,
  `  <td width=312 valign=top style='width:233.75pt;border-top:none;border-left:none'>`,
  `  <p class=MsoNormal style='text-align:right'>$1<o:p></o:p></p>`,
  `  </td>`,
  ` </tr>`,
  `</table>`,
].join('\r\n');

const word = (fragment: string) => ({
  'text/html': `<!--StartFragment-->${fragment}<!--EndFragment-->`,
  'text/plain': 'as Word puts it',
  'text/rtf': '{\\rtf1 }',
});

// Google Docs wraps the copy in a normal-weight <b> and styles every run.
const run = (style: string, text: string) =>
  `<span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;` +
  `${style};font-variant:normal;white-space:pre;white-space:pre-wrap;">${text}</span>`;
const PLAIN = 'font-weight:400;font-style:normal;text-decoration:none;vertical-align:baseline';
const docsItem = (text: string) =>
  `<li dir="ltr" style="list-style-type:lower-alpha;font-size:11pt;font-family:Arial,sans-serif;" aria-level="1">` +
  `<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;" role="presentation">${run(PLAIN, text)}</p></li>`;
const GOOGLE_DOCS = {
  'text/html':
    '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-0f1e2d3c-7fff-4a5b-8c9d-0e1f2a3b4c5d">' +
    '<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;">' +
    run('font-weight:700;font-style:normal;text-decoration:none;vertical-align:baseline', 'Bold') +
    run(
      'font-weight:400;font-style:italic;text-decoration:none;vertical-align:baseline',
      ' italic'
    ) +
    run(
      'font-weight:400;font-style:normal;text-decoration:underline;-webkit-text-decoration-skip:none;' +
        'text-decoration-skip-ink:none;vertical-align:baseline',
      ' underlined'
    ) +
    run(
      'font-weight:400;font-style:normal;text-decoration:line-through;vertical-align:baseline',
      ' struck'
    ) +
    run(PLAIN, ' x') +
    run(
      'font-weight:400;font-style:normal;text-decoration:none;vertical-align:super;font-size:0.6em',
      '2'
    ) +
    '</p><ol style="margin-top:0;margin-bottom:0;padding-inline-start:48px;">' +
    docsItem('First') +
    docsItem('Second') +
    '</ol></b><br class="Apple-interchange-newline">',
  'text/plain': 'Bold italic underlined struck x2\na. First\nb. Second',
};

const WEB_TABLE =
  '<table class="data" style="width:100%;border:1px solid red">' +
  '<caption style="color:blue">Fruit <b>prices</b></caption>' +
  '<thead><tr><th scope="col" style="background:#eee">Fruit</th><th scope="COL">Price</th></tr></thead>' +
  '<tbody><tr><th scope="row">Apple</th><td style="color:red"><i>$1</i></td></tr>' +
  '<tr><td colspan="2">Sold out</td></tr></tbody></table>';

const LISTS =
  '<ul><li>One</li><li><b>Two</b></li></ul><ol start="3" type="a"><li>Three</li><li>Four</li></ol>';

// The React editor's MathNode, parse rule and all, without its node view and toolbar.
const MathStub = Node.create({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({ latex: { default: '' } }),
  parseHTML: () => [
    { tag: 'span[data-latex]', getAttrs: (el) => ({ latex: el.getAttribute('data-raw') ?? '' }) },
  ],
  renderHTML: ({ node }) => ['span', { 'data-latex': '', 'data-raw': node.attrs.latex }],
});

// A rendered PIE prompt as a browser copies it: MathJax's output inside the saved math span.
const RENDERED_MATH = {
  'text/html':
    '<div style="font-family:Arial"><span style="color:red">Solve </span>' +
    '<span data-latex="" data-raw="x^2+1"><mjx-container><mjx-math>𝑥2+1</mjx-math></mjx-container></span>' +
    ' <b>now</b>.</div><p>Next line</p>',
  'text/plain': 'Solve 𝑥2+1 now.\nNext line',
};

const TABLES = [SemanticTable, TableRow, SemanticTableHeader, TableCell];

const PLAIN_TEXT: ExternalPasteSettings = { plainText: true, formatting: [] };

const editors: Editor[] = [];

const dataTransfer = (flavours: Record<string, string>, files: File[] = []) => ({
  types: [...Object.keys(flavours), ...(files.length ? ['Files'] : [])],
  items: [
    ...Object.keys(flavours).map((type) => ({ kind: 'string', type })),
    ...files.map((file) => ({ kind: 'file', type: file.type, getAsFile: () => file })),
  ],
  files,
  getData: (type: string) => flavours[type] ?? '',
});

function paste(editor: Editor, flavours: Record<string, string>, files: File[] = []) {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', { value: dataTransfer(flavours, files) });
  editor.view.dom.dispatchEvent(event);
}

const html = (markup: string) => ({ 'text/html': markup, 'text/plain': 'text' });

/** Drops at document position `pos`; happy-dom has no layout for `posAtCoords` to read. */
function drop(editor: Editor, pos: number, flavours: Record<string, string>) {
  vi.spyOn(editor.view, 'posAtCoords').mockReturnValue({ pos, inside: -1 });
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    dataTransfer: { value: dataTransfer(flavours) },
    clientX: { value: 0 },
    clientY: { value: 0 },
  });
  editor.view.dom.dispatchEvent(event);
}

/** A table's caption, and its cells as `th[scope]: text` or `td[colspan]: text`. */
function tableOf(markup: string) {
  const table = new DOMParser().parseFromString(markup, 'text/html').querySelector('table');
  const cell = (element: Element) => {
    const detail = ['scope', 'colspan']
      .filter((name) => element.hasAttribute(name) && element.getAttribute(name) !== '1')
      .map((name) => element.getAttribute(name))
      .join(' ');
    return `${element.tagName.toLowerCase()}${detail ? `[${detail}]` : ''}: ${element.innerHTML}`;
  };
  return {
    caption: table?.querySelector(':scope > caption')?.textContent ?? null,
    rows: Array.from(table?.querySelectorAll('tr') ?? [], (row) => Array.from(row.children, cell)),
  };
}

const png = () => new File(['png'], 'image.png', { type: 'image/png' });

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
  document.body.innerHTML = '';
});

describe.each([
  ['React', ReactExternalPaste],
  ['Svelte', SvelteExternalPaste],
])('ExternalPaste (%s editor)', (_name, ExternalPaste) => {
  type Options = {
    content?: string;
    extensions?: AnyExtension[];
    settings?: () => ExternalPasteSettings;
    withExternalPaste?: boolean;
  };

  /** An editor whose lowest-priority paste handler records what reaches it, as ImageUploadNode's would. */
  function createEditor({
    content = '',
    extensions = [],
    settings,
    withExternalPaste = true,
  }: Options = {}) {
    const reachedImageHandler = vi.fn(() => true);
    const editor = new Editor({
      element: document.body.appendChild(document.createElement('div')),
      content,
      extensions: [
        StarterKit,
        TextStyleKit,
        TextAlign.configure({ types: ['paragraph'] }),
        Subscript,
        Superscript,
        ...(withExternalPaste
          ? [settings ? ExternalPaste.configure({ settings }) : ExternalPaste]
          : []),
        ...extensions,
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

  const pasted = (flavours: Record<string, string>, options: Options = {}) => {
    const { editor } = createEditor(options);
    paste(editor, flavours);
    return editor.getHTML();
  };

  describe('with its formatting', () => {
    it("keeps Word's bold, italics, underline, strikethrough, subscript, superscript and line breaks", () => {
      expect(pasted(word(WORD_WINDOWS_MARKS))).toBe(
        '<p><strong>Bold</strong> and <em>italic</em>, <u>underlined</u>, <s>struck</s>, ' +
          'H<sub>2</sub>O and x<sup>2</sup>.</p><p>&nbsp;</p><p>Line one<br>Line two</p>'
      );
    });

    // StarterKit's trailing node adds an empty paragraph after a list that ends the document.
    it('keeps a Word for Windows list, nested by level', () => {
      expect(pasted(word(WORD_WINDOWS_LIST))).toBe(
        '<ul><li><p>First <strong>bullet</strong></p><ul><li><p>Nested</p></li></ul></li>' +
          '<li><p>Second</p></li></ul><p></p>'
      );
    });

    it("keeps a Word for Mac list's numbering", () => {
      expect(pasted(word(WORD_MAC_LIST))).toBe(
        '<ol start="3"><li><p>Third</p><ol type="a"><li><p>Sub-item</p><ol type="i"><li><p>Roman</p></li></ol>' +
          '</li></ol></li><li><p>Fourth</p></li></ol><p></p>'
      );
    });

    it("keeps a Word table's text and bold, and drops its widths, borders and alignment", () => {
      const markup = pasted(word(WORD_TABLE), { extensions: TABLES });

      expect(tableOf(markup)).toEqual({
        caption: null,
        rows: [
          ['td: <p><strong>Fruit</strong></p>', 'td: <p><strong>Price</strong></p>'],
          ['td: <p>Apple</p>', 'td: <p>$1</p>'],
        ],
      });
      expect(markup).not.toMatch(/Mso|windowtext|233\.75pt|valign|cellpadding|text-align/);
    });

    it('keeps Google Docs formatting and lists, and leaves its normal-weight wrapper out', () => {
      expect(pasted(GOOGLE_DOCS)).toBe(
        '<p><strong>Bold</strong><em> italic</em><u> underlined</u><s> struck</s> x<sup>2</sup></p>' +
          '<ol type="a"><li><p>First</p></li><li><p>Second</p></li></ol><p></p>'
      );
    });

    it("keeps a table's caption, header scopes and spans, and drops its styling", () => {
      const markup = pasted(html(WEB_TABLE), { extensions: TABLES });

      expect(tableOf(markup)).toEqual({
        caption: 'Fruit prices',
        rows: [
          ['th[col]: <p>Fruit</p>', 'th[col]: <p>Price</p>'],
          ['th[row]: <p>Apple</p>', 'td: <p><em>$1</em></p>'],
          ['td[2]: <p>Sold out</p>'],
        ],
      });
      expect(markup).not.toMatch(/class=|red|blue|#eee|100%/);
    });

    it('makes headings, quotes, code blocks and divs paragraphs, and drops links, rules and images', () => {
      expect(
        pasted(
          html(
            '<h1 style="color:red">Title</h1><blockquote><p>Quoted</p></blockquote>' +
              '<pre><code>let x = 1;\nlet y = 2;</code></pre><hr>' +
              '<div class="note">See <a href="https://example.com">the site</a>.</div>'
          )
        )
      ).toBe('<p>Title</p><p>Quoted</p><p>let x = 1;<br>let y = 2;</p><p>See the site.</p>');
    });

    it('keeps only the marks it is given', () => {
      expect(
        pasted(word(WORD_WINDOWS_MARKS), {
          settings: () => ({ plainText: false, formatting: ['italic', 'superscript'] }),
        })
      ).toBe(
        '<p>Bold and <em>italic</em>, underlined, struck, H2O and x<sup>2</sup>.</p>' +
          '<p>&nbsp;</p><p>Line one<br>Line two</p>'
      );
    });

    it('makes lists it is not given lines behind their bullet or number', () => {
      expect(
        pasted(html(LISTS), { settings: () => ({ plainText: false, formatting: ['bold'] }) })
      ).toBe('<p>• One</p><p>• <strong>Two</strong></p><p>c. Three</p><p>d. Four</p>');
    });

    it('makes a table it is not given a line per row, with tabs between its cells', () => {
      expect(
        pasted(html(WEB_TABLE), {
          extensions: TABLES,
          settings: () => ({ plainText: false, formatting: ['italic'] }),
        })
      ).toBe('<p>Fruit prices</p><p>Fruit\tPrice</p><p>Apple\t<em>$1</em></p><p>Sold out</p>');
    });

    it.each([
      ['one list item', '<ul><li>Only</li></ul>'],
      ['a list', '<ul><li>One</li><li>Two</li></ul>'],
      ['a numbered list', '<ol start="2" type="A"><li>B</li><li>C</li></ol>'],
      ['paragraphs', '<p>One</p><p>Two <strong>bold</strong></p>'],
      ['a line with a break', '<p>Line<br>break</p>'],
      ['a fragment of a line', '<span>, inserted</span>'],
    ])('places %s as ProseMirror would', (_case, markup) => {
      for (const at of ['<p></p>', '<p>Before</p>', '<ul><li><p>Item</p></li></ul>']) {
        const results = [true, false].map((withExternalPaste) => {
          const { editor } = createEditor({ content: at, withExternalPaste });
          editor.commands.setTextSelection(
            editor.state.doc.content.size - (at === '<p></p>' ? 1 : 3)
          );
          paste(editor, html(markup));
          return editor.getHTML();
        });

        expect(results[0]).toBe(results[1]);
      }
    });

    it('places a table as ProseMirror would', () => {
      const results = [true, false].map((withExternalPaste) => {
        const { editor } = createEditor({
          content: '<p>Before</p>',
          extensions: TABLES,
          withExternalPaste,
        });
        editor.commands.setTextSelection(4);
        paste(editor, html('<table><tr><th scope="col">A</th></tr><tr><td>B</td></tr></table>'));
        return editor.getHTML();
      });

      expect(results[0]).toBe(results[1]);
    });

    it('keeps math copied from rendered PIE content', () => {
      expect(pasted(RENDERED_MATH, { extensions: [MathStub] })).toBe(
        '<p>Solve <span data-latex="" data-raw="x^2+1"></span> <strong>now</strong>.</p><p>Next line</p>'
      );
    });

    it('pastes a table over a selection of table cells cell by cell', () => {
      const { editor } = createEditor({
        content:
          '<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr>' +
          '<tr><td><p>c</p></td><td><p>d</p></td></tr></tbody></table>',
        extensions: TABLES,
      });
      selectAllCells(editor);

      paste(editor, {
        'text/html':
          '<table style="font-family:Calibri"><tr><td><b>1</b></td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>',
        'text/plain': '1\t2\r\n3\t4\r\n',
      });

      expect(cellTexts(editor)).toEqual(['1', '2', '3', '4']);
      expect(editor.getHTML()).toContain('<strong>1</strong>');
      expect(editor.getHTML()).not.toContain('Calibri');
    });

    it('drops Word content with its formatting', () => {
      const { editor } = createEditor();

      drop(editor, 1, WORD);

      expect(editor.getHTML()).toBe('<p>Read the <strong>passage</strong>.</p><p>Second line</p>');
    });

    it('reads its settings at each paste', () => {
      let settings = PLAIN_TEXT;
      const { editor } = createEditor({ settings: () => settings });

      paste(editor, { 'text/html': '<p><b>plain</b></p>', 'text/plain': 'plain' });
      settings = { plainText: false, formatting: ['bold'] };
      paste(editor, html('<p><b>bold</b></p>'));

      expect(editor.getHTML()).toBe('<p>plain<strong>bold</strong></p>');
    });
  });

  describe('as plain text', () => {
    const plainText = () => PLAIN_TEXT;

    it('pastes Word content one paragraph per line', () => {
      expect(pasted(WORD, { settings: plainText })).toBe(
        '<p>Read the passage.</p><p>Second line</p>'
      );
    });

    it('keeps blank lines as empty paragraphs and adds none for a trailing line break', () => {
      expect(
        pasted({ ...WORD, 'text/plain': 'First\r\n\r\nSecond\r\n' }, { settings: plainText })
      ).toBe('<p>First</p><p>&nbsp;</p><p>Second</p>');
    });

    it('spreads a spreadsheet range across a selection of table cells', () => {
      const { editor } = createEditor({
        content:
          '<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr>' +
          '<tr><td><p>c</p></td><td><p>d</p></td></tr></tbody></table>',
        extensions: TABLES,
        settings: plainText,
      });
      selectAllCells(editor);

      paste(editor, {
        'text/html':
          '<table style="font-family:Calibri"><tr><td><b>1</b></td><td>2</td></tr><tr><td>3</td><td>4</td></tr></table>',
        'text/plain': '1\t2\r\n3\t4\r\n',
        'text/rtf': '{\\rtf1 }',
      });

      expect(cellTexts(editor)).toEqual(['1', '2', '3', '4']);
      expect(editor.getHTML()).not.toMatch(/Calibri|strong/);
    });

    it('drops Word content as plain text', () => {
      const { editor } = createEditor({ settings: plainText });

      drop(editor, 1, WORD);

      expect(editor.getHTML()).toBe('<p>Read the passage.</p><p>Second line</p>');
    });

    it('keeps math copied from rendered PIE content and drops its formatting', () => {
      expect(pasted(RENDERED_MATH, { extensions: [MathStub], settings: plainText })).toBe(
        '<p>Solve <span data-latex="" data-raw="x^2+1"></span> now.</p><p>Next line</p>'
      );
    });

    it('keeps math from a rendered table, one line per row', () => {
      expect(
        pasted(
          {
            'text/html':
              '<table><tr><td>Area</td><td><span data-latex="" data-raw="\\pi r^2"><mjx-container>' +
              '</mjx-container></span></td></tr><tr><td>Side</td><td>4</td></tr></table>',
            'text/plain': 'Area\t𝜋𝑟2\nSide\t4',
          },
          { extensions: [MathStub, ...TABLES], settings: plainText }
        )
      ).toBe('<p>Area\t<span data-latex="" data-raw="\\pi r^2"></span></p><p>Side\t4</p>');
    });

    it('keeps math from a rendered inline fragment in the line it lands in', () => {
      const { editor } = createEditor({
        content: '<p>Before</p>',
        extensions: [MathStub],
        settings: plainText,
      });
      editor.commands.setTextSelection(7);

      paste(editor, {
        'text/html':
          ', solve <span data-latex="" data-raw="x"><mjx-container></mjx-container></span>',
        'text/plain': ', solve 𝑥',
      });

      expect(editor.getHTML()).toBe(
        '<p>Before, solve <span data-latex="" data-raw="x"></span></p>'
      );
    });

    it('pastes rendered math as text in an editor without math', () => {
      expect(pasted(RENDERED_MATH, { settings: plainText })).toBe(
        '<p>Solve 𝑥2+1 now.</p><p>Next line</p>'
      );
    });
  });

  it('keeps the formatting of content copied from a PIE editor', () => {
    expect(
      pasted(
        {
          'text/html': '<p data-pm-slice="1 1 []">Copied <strong>bold</strong></p>',
          'text/plain': 'Copied bold',
        },
        { settings: () => PLAIN_TEXT }
      )
    ).toBe('<p>Copied <strong>bold</strong></p>');
  });

  it('pastes HTML that only mentions data-pm-slice in its text as outside content', () => {
    expect(
      pasted({
        'text/html': '<p><span style="color:red">See data-pm-slice="1 1 []"</span></p>',
        'text/plain': 'See data-pm-slice="1 1 []"',
      })
    ).toBe('<p>See data-pm-slice="1 1 []"</p>');
  });

  it('leaves a pasted image to the image handler', () => {
    const { reachedImageHandler, editor } = createEditor();

    paste(editor, { 'text/html': '<img src="https://example.com/a.png">' }, [png()]);

    expect(reachedImageHandler).toHaveBeenCalledTimes(1);
  });

  it('pastes the text, not the picture of it, when Word puts both on the clipboard', () => {
    const { editor, reachedImageHandler } = createEditor();

    paste(editor, WORD, [png()]);

    expect(reachedImageHandler).not.toHaveBeenCalled();
    expect(editor.getHTML()).toBe('<p>Read the <strong>passage</strong>.</p><p>Second line</p>');
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

  it('leaves a drag within the editor to ProseMirror', () => {
    const { editor } = createEditor({
      content: '<p><strong>bold</strong></p>',
      settings: () => PLAIN_TEXT,
    });
    editor.view.dragging = { slice: editor.state.doc.slice(1, 5), move: false };

    drop(editor, 5, WORD);

    expect(editor.getHTML()).toBe('<p><strong>boldbold</strong></p>');
  });

  it('leaves a plain-text paste as it was', () => {
    expect(pasted({ 'text/plain': 'First\nSecond' })).toBe('<p>First</p><p>Second</p>');
  });
});

function selectAllCells(editor: Editor) {
  const cells: number[] = [];
  editor.state.doc.descendants((node, pos) => {
    if (node.type.spec.tableRole === 'cell') cells.push(pos);
  });
  editor.commands.setCellSelection({ anchorCell: cells[0], headCell: cells[cells.length - 1] });
}

function cellTexts(editor: Editor) {
  const texts: string[] = [];
  editor.state.doc.descendants((node) => {
    if (node.type.spec.tableRole === 'cell') texts.push(node.textContent);
  });
  return texts;
}
