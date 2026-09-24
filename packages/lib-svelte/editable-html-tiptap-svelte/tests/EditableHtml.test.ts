/**
 * The editor reports the author's edits and nothing else, leaves URLs as text, and keeps its
 * stylesheet inside its own instances: the consuming elements render without a shadow root, so
 * that stylesheet lands in the host page's <head>.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Editor } from '@tiptap/core';
import { flushSync, mount, unmount } from 'svelte';
import { compile } from 'svelte/compiler';
import { afterEach, describe, expect, it, vi } from 'vitest';
import EditableHtml from '../src/EditableHtml.svelte';
import { reactiveProps } from './reactive-props.svelte';

type Props = {
  markup?: string;
  onChange?: (html: string) => void;
  disabled?: boolean;
};

// A string, not a URL object: happy-dom replaces the global `URL`, which `readFileSync` rejects.
const SOURCE_PATH = resolve(dirname(fileURLToPath(import.meta.url)), '../src/EditableHtml.svelte');

const mounted: Array<ReturnType<typeof mount>> = [];

function mountEditor(initial: Props) {
  const target = document.createElement('div');
  document.body.appendChild(target);
  const props = reactiveProps(initial);
  mounted.push(mount(EditableHtml, { target, props }));
  flushSync();

  const dom = target.querySelector('.ProseMirror') as (HTMLElement & { editor?: Editor }) | null;
  if (!dom?.editor) {
    throw new Error('EditableHtml did not mount a TipTap editor');
  }
  return { target, props, editor: dom.editor };
}

/** Inserts text at the selection, as a keystroke or an IME commit does. */
function type(editor: Editor, text: string) {
  const { from, to } = editor.state.selection;
  editor.view.dispatch(editor.state.tr.insertText(text, from, to));
}

function selectAll(editor: Editor) {
  editor.commands.setTextSelection({ from: 1, to: editor.state.doc.content.size - 1 });
}

afterEach(() => {
  for (const component of mounted.splice(0)) {
    unmount(component);
  }
  document.body.innerHTML = '';
  for (const style of document.head.querySelectorAll('style[data-test-editable-html]')) {
    style.remove();
  }
  vi.restoreAllMocks();
});

describe('EditableHtml onChange', () => {
  it('does not report the markup it mounts with', () => {
    const onChange = vi.fn();
    const { editor } = mountEditor({ markup: '<p>Hello</p>', onChange });

    expect(editor.getHTML()).toBe('<p>Hello</p>');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not report markup the host pushes in', () => {
    const onChange = vi.fn();
    const { editor, props } = mountEditor({ markup: '<p>Hello</p>', onChange });
    onChange.mockClear();

    props.markup = '<p>Changed by the host</p>';
    flushSync();

    expect(editor.getHTML()).toBe('<p>Changed by the host</p>');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not report disabled being toggled', () => {
    const onChange = vi.fn();
    const { editor, props } = mountEditor({ markup: '<p>Hello</p>', onChange });
    onChange.mockClear();

    props.disabled = true;
    flushSync();
    expect(editor.isEditable).toBe(false);

    props.disabled = false;
    flushSync();
    expect(editor.isEditable).toBe(true);

    expect(onChange).not.toHaveBeenCalled();
  });

  it('reports an edit the author makes', () => {
    const onChange = vi.fn();
    const { editor } = mountEditor({ markup: '<p>Hello</p>', onChange });
    editor.commands.setTextSelection(editor.state.doc.content.size - 1);

    type(editor, ' world');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('<p>Hello world</p>');
  });

  it('reports an edit made through the toolbar', () => {
    const onChange = vi.fn();
    const { editor, target } = mountEditor({ markup: '<p>Hello</p>', onChange });
    selectAll(editor);

    const bold = target.querySelector('button[title="Bold"]') as HTMLButtonElement;
    bold.click();

    expect(onChange).toHaveBeenCalledWith('<p><strong>Hello</strong></p>');
  });

  it('does not report Done when nothing was edited', () => {
    const onChange = vi.fn();
    const { target } = mountEditor({ markup: '<p>Hello</p>', onChange });
    onChange.mockClear();

    (target.querySelector('button[title="Done"]') as HTMLButtonElement).click();

    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('EditableHtml links', () => {
  it('leaves a typed URL as text', () => {
    const { editor } = mountEditor({ markup: '' });

    type(editor, 'https://example.com ');

    expect(editor.getHTML()).toBe('<p>https://example.com </p>');
  });

  it('leaves a pasted URL as text', () => {
    const { editor } = mountEditor({ markup: '' });

    editor.view.pasteText('https://example.com');

    expect(editor.getHTML()).toBe('<p>https://example.com</p>');
  });

  it('leaves a URL pasted over a selection as text', () => {
    const { editor } = mountEditor({ markup: '<p>Hello</p>' });
    selectAll(editor);

    editor.view.pasteText('https://example.com');

    expect(editor.getHTML()).not.toContain('<a');
  });

  it('keeps links that are already in the markup', () => {
    const { editor } = mountEditor({ markup: '<p><a href="https://example.com">site</a></p>' });

    expect(editor.getHTML()).toContain('href="https://example.com"');
  });

  it('registers each extension once', () => {
    const warn = vi.spyOn(console, 'warn');
    mountEditor({ markup: '<p>Hello</p>' });

    const duplicates = warn.mock.calls.filter((args) =>
      args.some((arg) => String(arg).includes('Duplicate extension names'))
    );
    expect(duplicates).toEqual([]);
  });
});

describe('EditableHtml styles', () => {
  function compiledCss(cssHash?: string) {
    const { css } = compile(readFileSync(SOURCE_PATH, 'utf8'), {
      filename: 'EditableHtml.svelte',
      css: 'external',
      ...(cssHash ? { cssHash: () => cssHash } : {}),
    });
    if (!css) {
      throw new Error('EditableHtml emitted no CSS');
    }
    return css.code;
  }

  it('anchors every selector under the component root', () => {
    const css = compiledCss().replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = (css.match(/[^{}]+(?=\{)/g) ?? []).flatMap((list) =>
      list.split(',').map((selector) => selector.trim())
    );

    expect(selectors.length).toBeGreaterThan(0);
    expect(selectors.filter((selector) => !/^\.pie-editable-html\.svelte-/.test(selector))).toEqual(
      []
    );
  });

  it('leaves unrelated toolbars and ProseMirror editors on the page alone', () => {
    const { target } = mountEditor({ markup: '<p>Hello</p>' });
    // Compile with the scope class the mounted instance carries, so the injected rules can match it.
    const root = target.firstElementChild as HTMLElement;
    const hash = [...root.classList].find((name) => name.startsWith('svelte-'));

    const unrelated = document.createElement('div');
    unrelated.innerHTML = '<div class="toolbar"></div><div class="ProseMirror"><p>Other</p></div>';
    document.body.appendChild(unrelated);
    const otherToolbar = unrelated.querySelector('.toolbar') as HTMLElement;
    const otherParagraph = unrelated.querySelector('.ProseMirror p') as HTMLElement;
    const paragraphMarginBefore = getComputedStyle(otherParagraph).marginTop;

    const style = document.createElement('style');
    style.setAttribute('data-test-editable-html', '');
    style.textContent = compiledCss(hash);
    document.head.appendChild(style);

    // The stylesheet does apply inside the component: its own toolbar is hidden until focus.
    const ownToolbar = target.querySelector('.toolbar') as HTMLElement;
    expect(getComputedStyle(ownToolbar).opacity).toBe('0');

    expect(getComputedStyle(otherToolbar).opacity).not.toBe('0');
    expect(getComputedStyle(otherToolbar).pointerEvents).not.toBe('none');
    expect(getComputedStyle(otherToolbar).position).not.toBe('absolute');
    expect(getComputedStyle(otherParagraph).marginTop).toBe(paragraphMarginBefore);
  });

  it('styles the Done and align-menu buttons from the stylesheet alone', () => {
    const { target } = mountEditor({ markup: '<p>Hello</p>' });
    const root = target.firstElementChild as HTMLElement;
    const hash = [...root.classList].find((name) => name.startsWith('svelte-'));
    const style = document.createElement('style');
    style.setAttribute('data-test-editable-html', '');
    style.textContent = compiledCss(hash);
    document.head.appendChild(style);

    (target.querySelector('button[title="Text Alignment"]') as HTMLButtonElement).click();
    flushSync();

    const buttons = ['Done', 'Align Left', 'Align Center', 'Align Right'].map(
      (title) => target.querySelector(`button[title="${title}"]`) as HTMLButtonElement
    );
    for (const button of buttons) {
      // An inline `style` overrode the stylesheet's padding and colour tokens.
      expect(button.getAttribute('style')).toBeNull();
      expect(getComputedStyle(button).paddingTop).toBe('4px');
    }
  });
});
