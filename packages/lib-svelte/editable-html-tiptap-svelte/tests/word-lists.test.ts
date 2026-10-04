// Runs both copies of the module, which differ only in their comments, against the same cases.
import { describe, expect, it } from 'vitest';
import { rebuildWordLists as reactRebuildWordLists } from '../../../lib-react/editable-html-tip-tap/src/word-lists';
import { rebuildWordLists as svelteRebuildWordLists } from '../src/word-lists';

/** A paragraph of Word list `list` at `level`, led by `marker` as Word writes it. */
const item = (marker: string, text: string, { list = 'l0', level = 1 } = {}) =>
  `<p class="MsoListParagraph" style="margin-left:${level / 2}in;text-indent:-.25in;mso-list:${list} level${level} lfo1">` +
  `<span style="mso-list:Ignore">${marker}<span style="font:7.0pt 'Times New Roman'">&nbsp;&nbsp; </span></span>` +
  `${text}</p>`;

describe.each([
  ['React', reactRebuildWordLists],
  ['Svelte', svelteRebuildWordLists],
])('rebuildWordLists (%s editor)', (_name, rebuildWordLists) => {
  it('returns HTML without Word lists as it is', () => {
    const html = '<p class="MsoNormal">Plain</p><ul><li>Listed</li></ul>';

    expect(rebuildWordLists(html)).toBe(html);
  });

  it('nests items by level', () => {
    expect(
      rebuildWordLists(
        item('·', 'One') +
          item('o', 'Nested', { level: 2 }) +
          item('§', 'Deeper', { level: 3 }) +
          item('·', 'Two')
      )
    ).toBe(
      '<ul><li><p>One</p><ul><li><p>Nested</p><ul><li><p>Deeper</p></li></ul></li></ul></li>' +
        '<li><p>Two</p></li></ul>'
    );
  });

  it('nests an item that skips a level under the item before it', () => {
    expect(
      rebuildWordLists(item('1.', 'One') + item('i.', 'Skipped', { level: 3 }) + item('2.', 'Two'))
    ).toBe(
      '<ol><li><p>One</p><ol type="i"><li><p>Skipped</p></li></ol></li><li><p>Two</p></li></ol>'
    );
  });

  it('starts a list of its own for items of the other kind at the same level', () => {
    expect(rebuildWordLists(item('1.', 'One') + item('·', 'Bullet') + item('2.', 'Two'))).toBe(
      '<ol><li><p>One</p></li></ol><ul><li><p>Bullet</p></li></ul><ol start="2"><li><p>Two</p></li></ol>'
    );
  });

  it('joins items with only whitespace and comments between them', () => {
    const markup = rebuildWordLists(
      `${item('1.', 'One')}\r\n<!--[if !supportLists]-->\r\n${item('2.', 'Two')}`
    );

    // What stays between them, after the list, is left for ProseMirror to drop.
    expect(markup.replace(/<!--.*?-->|\s/g, '')).toBe(
      '<ol><li><p>One</p></li><li><p>Two</p></li></ol>'
    );
  });

  it('starts a new list after a paragraph that is no item, and at an item of another Word list', () => {
    expect(
      rebuildWordLists(
        item('1.', 'One') +
          '<p class="MsoNormal">Between</p>' +
          item('2.', 'Two') +
          item('·', 'Other', { list: 'l1' })
      )
    ).toBe(
      '<ol><li><p>One</p></li></ol><p class="MsoNormal">Between</p><ol start="2"><li><p>Two</p></li></ol>' +
        '<ul><li><p>Other</p></li></ul>'
    );
  });

  it.each([
    ['1.', '<ol>'],
    ['3.', '<ol start="3">'],
    ['a)', '<ol type="a">'],
    ['(iv)', '<ol type="i" start="4">'],
    ['B.', '<ol type="A" start="2">'],
    ['c.', '<ol type="a" start="3">'],
    ['i.', '<ol type="i">'],
    ['XII.', '<ol type="I" start="12">'],
    ['aa.', '<ol type="a" start="27">'],
    ['2.1', '<ol>'],
    ['2.3.', '<ol start="3">'],
    ['·', '<ul>'],
    ['o', '<ul>'],
    ['§', '<ul>'],
    ['-', '<ul>'],
  ])('reads the list that a first item marked %s starts', (marker, list) => {
    const close = list.startsWith('<ol') ? '</ol>' : '</ul>';

    expect(rebuildWordLists(item(marker, 'One'))).toBe(`${list}<li><p>One</p></li>${close}`);
  });

  it('keeps the formatting inside an item', () => {
    expect(rebuildWordLists(item('1.', '<b>Bold</b> and <i>italic</i>'))).toBe(
      '<ol><li><p><b>Bold</b> and <i>italic</i></p></li></ol>'
    );
  });

  it('rebuilds a list inside a table cell', () => {
    expect(
      rebuildWordLists(`<table><tbody><tr><td>${item('·', 'In a cell')}</td></tr></tbody></table>`)
    ).toBe('<table><tbody><tr><td><ul><li><p>In a cell</p></li></ul></td></tr></tbody></table>');
  });
});
