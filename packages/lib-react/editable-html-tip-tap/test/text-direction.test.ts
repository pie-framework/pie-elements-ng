// @vitest-environment happy-dom
import { Editor, generateHTML, generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it } from 'vitest';

import { DivNode } from '../src/extensions/div-node';
import { BlockDirection, ContentLanguage } from '../src/extensions/text-direction';
import { detectScriptDirection } from '../src/utils/direction';

const extensions = [StarterKit, DivNode, BlockDirection, ContentLanguage];

/** The markup a field holding `html` saves after the editor loads it, untouched. */
const roundTrip = (html: string) => generateHTML(generateJSON(html, extensions), extensions);

let editor: Editor | undefined;
const edit = (html: string, baseDirection = 'ltr') => {
  editor = new Editor({
    extensions: [StarterKit, DivNode, BlockDirection.configure({ baseDirection: () => baseDirection }), ContentLanguage],
    content: html,
  });
  return editor;
};

afterEach(() => {
  editor?.destroy();
  editor = undefined;
});

describe('detectScriptDirection', () => {
  it.each([
    ['ما هو ناتج ٣ + ٤؟', 'rtl'],
    ['שלום', 'rtl'],
    ['What is 3 + 4?', 'ltr'],
    ['٣ + ٤ = ٧ ثم', 'rtl'],
    ['42 = x then', 'ltr'],
    ['‏abc', 'rtl'],
    ['‎مرحبا', 'ltr'],
  ])('reads %j as %s from its first strong character', (text, dir) => {
    expect(detectScriptDirection(text)).toBe(dir);
  });

  it.each(['', '3 + 4 = 7', '٣ + ٤', '?!', null, undefined])('has no direction for %j', (text) => {
    expect(detectScriptDirection(text)).toBeUndefined();
  });
});

describe('paragraph dir', () => {
  it('stamps an edited block whose script runs against the editor’s direction', () => {
    const e = edit('<p>x</p>');
    e.commands.selectAll();
    e.commands.insertContent('<p>ما هو ناتج ٣ + ٤؟</p><p>What is 3 + 4?</p><p>12</p>');
    expect(e.getHTML()).toBe('<p dir="rtl">ما هو ناتج ٣ + ٤؟</p><p>What is 3 + 4?</p><p>12</p>');
  });

  it('stamps against a right-to-left editor', () => {
    const e = edit('<p>x</p>', 'rtl');
    e.commands.selectAll();
    e.commands.insertContent('<p>ما هو ناتج ٣ + ٤؟</p><p>What is 3 + 4?</p>');
    expect(e.getHTML()).toBe('<p>ما هو ناتج ٣ + ٤؟</p><p dir="ltr">What is 3 + 4?</p>');
  });

  it('keeps a declared dir that matches the editor’s direction', () => {
    const e = edit('<p dir="ltr">Hello</p>');
    e.commands.insertContentAt(e.state.doc.content.size - 1, ' world');
    expect(e.getHTML()).toBe('<p dir="ltr">Hello world</p>');
  });

  it('re-derives a stamp when the author rewrites the block in another script', () => {
    const e = edit('<p dir="rtl">مرحبا</p>');
    e.commands.setTextSelection({ from: 1, to: e.state.doc.content.size - 1 });
    e.commands.insertContent('Hello');
    expect(e.getHTML()).toBe('<p>Hello</p>');
  });

  it('drops the stamp from a block left with no strong character', () => {
    const e = edit('<p dir="rtl">مرحبا</p>');
    e.commands.setTextSelection({ from: 1, to: e.state.doc.content.size - 1 });
    e.commands.insertContent('42');
    expect(e.getHTML()).toBe('<p>42</p>');
  });

  it('keeps a direction the author pinned against the script', () => {
    const e = edit('<p>Hello</p>');
    e.commands.selectAll();
    e.commands.setBlockDirection('rtl');
    e.commands.insertContentAt(e.state.doc.content.size - 1, ' world');
    expect(e.getHTML()).toBe('<p dir="rtl">Hello world</p>');
  });

  it('returns a pinned block to detection', () => {
    const e = edit('<p dir="rtl">Hello</p>');
    e.commands.selectAll();
    e.commands.unsetBlockDirection();
    expect(e.getHTML()).toBe('<p>Hello</p>');
  });

  it('reads a saved dir that contradicts the script as pinned', () => {
    const e = edit('<p dir="rtl">Hello</p>');
    e.commands.insertContentAt(e.state.doc.content.size - 1, ' world');
    expect(e.getHTML()).toBe('<p dir="rtl">Hello world</p>');
  });

  it('stamps div blocks', () => {
    const e = edit('<div>x</div>');
    e.commands.insertContentAt(1, 'مرحبا ');
    expect(e.getHTML()).toContain('<div dir="rtl">');
  });

  it('leaves blocks the author does not touch as they were loaded', () => {
    expect(roundTrip('<p>مرحبا</p><p>Hello</p>')).toBe('<p>مرحبا</p><p>Hello</p>');
    const e = edit('<p>Hello</p><p>مرحبا</p>');
    e.commands.insertContentAt(e.state.doc.content.size - 1, '!');
    expect(e.getHTML()).toBe('<p>Hello</p><p dir="rtl">مرحبا!</p>');
  });

  it('stamps nothing when content is loaded', () => {
    const e = edit('<p>x</p>');
    e.commands.setContent('<p>مرحبا</p><p>Hello</p>', { emitUpdate: false });
    expect(e.getHTML()).toBe('<p>مرحبا</p><p>Hello</p>');
  });

  it('round-trips the values it writes and drops ones it does not', () => {
    expect(roundTrip('<p dir="rtl">مرحبا</p><p dir="ltr">Hello</p>')).toBe(
      '<p dir="rtl">مرحبا</p><p dir="ltr">Hello</p>',
    );
    expect(roundTrip('<p dir="auto">مرحبا</p>')).toBe('<p>مرحبا</p>');
  });
});

describe('span lang', () => {
  it('marks a run with its language and that language’s direction', () => {
    const e = edit('<p>The word salaam</p>');
    e.commands.setTextSelection({ from: 10, to: 16 });
    e.commands.setContentLanguage('ar');
    expect(e.getHTML()).toContain('<span lang="ar" dir="rtl">salaam</span>');
  });

  it('removes the mark', () => {
    const e = edit('<p>The word <span lang="ar" dir="rtl">سلام</span></p>');
    e.commands.selectAll();
    e.commands.unsetContentLanguage();
    expect(e.getHTML()).not.toContain('lang=');
  });

  it('round-trips a lang span and canonicalizes its tag', () => {
    expect(roundTrip('<p dir="ltr">Say <span lang="ar-sa">مرحبا</span> now</p>')).toBe(
      '<p dir="ltr">Say <span lang="ar-SA" dir="rtl">مرحبا</span> now</p>',
    );
  });

  it('keeps a lang that is not a usable tag as authored, with no dir', () => {
    expect(roundTrip('<p><span lang="Spanish">hola</span></p>')).toBe('<p><span lang="Spanish">hola</span></p>');
  });

  it('keeps a lang span that also carries a style', () => {
    expect(roundTrip('<p><span lang="en" style="color: red">red</span></p>')).toContain('lang="en"');
  });
});
