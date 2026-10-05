import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the toolbar.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
// The response areas' node views have no bearing on the toolbar either.
vi.mock('../src/components/respArea/DragInTheBlank/DragInTheBlank.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/ExplicitConstructedResponse.js', () => ({ default: () => null }));

const { EditableHtml } = await import('../src/components/EditableHtml');

const editor = (props: Record<string, unknown>) => (
  <>
    <button type="button">Before</button>
    <EditableHtml markup="" onChange={vi.fn()} activePlugins={['bold', 'italic']} {...props} />
    <button type="button">After</button>
  </>
);

const textbox = () => waitFor(() => screen.getByRole('textbox'));

// role queries skip inert subtrees, so look the toolbar up by its role attribute.
const toolbar = () => document.querySelector('[role="toolbar"]') as HTMLElement;
const inert = (el: Element) => el.closest('[inert]') !== null;

describe('EditableHtml toolbar', () => {
  it('is a named toolbar with no tab stop of its own', async () => {
    render(editor({}));
    await textbox();

    const bar = toolbar();
    expect(bar).toHaveAttribute('aria-label', 'Editing tools');
    expect(bar).toHaveAttribute('tabindex', '-1');
    expect(document.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])')).toHaveLength(0);
  });

  it('takes its name from the translator in the given language', async () => {
    render(editor({ language: 'es_ES' }));
    await textbox();

    expect(toolbar()).toHaveAttribute('aria-label', 'Herramientas de edición');
  });

  it.each([
    ['en_US', ['Bold', 'Italic', 'Bulleted list', 'Undo', 'Redo'], 'Done'],
    ['es_ES', ['Negrita', 'Cursiva', 'Lista con viñetas', 'Deshacer', 'Rehacer'], 'Listo'],
  ])('names its buttons in the %s item language', async (language, names, done) => {
    render(editor({ language, activePlugins: ['bold', 'italic', 'bulleted-list', 'undo', 'redo'] }));
    await textbox();

    const buttons = [...toolbar().querySelectorAll('button')];
    expect(buttons.map((b) => b.getAttribute('aria-label'))).toEqual([...names, done]);
    // The done button is an icon with no tooltip.
    expect(buttons.map((b) => b.getAttribute('title'))).toEqual([...names, null]);
  });

  it('is inert while the editor lacks focus, and open while focus is anywhere in the editor', async () => {
    render(editor({}));
    const box = await textbox();

    expect(inert(toolbar())).toBe(true);

    act(() => box.focus());
    await waitFor(() => expect(inert(toolbar())).toBe(false));

    // Tab from the text into the toolbar keeps it open.
    const bold = toolbar().querySelector('button[aria-label="Bold"]') as HTMLButtonElement;
    act(() => bold.focus());
    expect(document.activeElement).toBe(bold);
    expect(inert(toolbar())).toBe(false);

    act(() => screen.getByRole('button', { name: 'After' }).focus());
    await waitFor(() => expect(inert(toolbar())).toBe(true));
  });

  it('stays open when the caller keeps it always visible', async () => {
    render(editor({ toolbarOpts: { alwaysVisible: true } }));
    await textbox();

    expect(inert(toolbar())).toBe(false);
  });
});

// Where Tab goes from `from`: the next element in document order that takes sequential focus,
// outside inert subtrees. Nothing on these pages has a positive tabindex.
const nextTabStop = (from: Element) =>
  [...document.querySelectorAll<HTMLElement>('*')].find((el) => {
    if (!(from.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) || el.closest('[inert]')) {
      return false;
    }
    if ((el as HTMLButtonElement).disabled) {
      return false;
    }
    const tabindex = el.getAttribute('tabindex');
    return tabindex === null ? el.matches('button, a[href], input, select, textarea') : Number(tabindex) >= 0;
  });

describe('EditableHtml response-area toolbar', () => {
  const area = (type: string) => `<span data-type="${type}" data-index="0" data-id="0" data-value=""></span>`;

  // Focuses the editor and selects its one response area, as a click on the area does.
  const selectArea = async (type: string, nodeName: string) => {
    let tiptap: any;
    render(
      editor({
        markup: `<p>Fill ${area(nodeName)} in.</p>`,
        activePlugins: ['bold', 'responseArea'],
        responseAreaProps: { type, options: {} },
        editorRef: (instance: unknown) => {
          tiptap = instance;
        },
      }),
    );
    const box = await textbox();
    await waitFor(() => expect(tiptap).toBeTruthy());

    let pos = -1;
    tiptap.state.doc.descendants((node: any, at: number) => {
      if (node.type.name === nodeName) pos = at;
    });
    act(() => box.focus());
    act(() => {
      tiptap.commands.setNodeSelection(pos);
    });

    return { box, tiptap };
  };

  it('shows the delete toolbar, open to Tab, while a drag-in-the-blank area is selected', async () => {
    const { box } = await selectArea('drag-in-the-blank', 'drag_in_the_blank');

    const bar = await waitFor(() => {
      const found = document.querySelector('[role="toolbar"][aria-label="Response area"]');
      expect(found).not.toBeNull();
      return found as HTMLElement;
    });
    await waitFor(() => expect(bar.closest('.pie-toolbar')).toHaveClass('focused'));
    expect(inert(bar)).toBe(false);
    expect(nextTabStop(box)).toBe(screen.getByRole('button', { name: 'Delete response area' }));
  });

  it('removes the area when its delete button is activated', async () => {
    const { tiptap } = await selectArea('drag-in-the-blank', 'drag_in_the_blank');
    const remove = await waitFor(() => screen.getByRole('button', { name: 'Delete response area' }));

    act(() => remove.focus());
    expect(inert(remove)).toBe(false);
    act(() => remove.click());

    await waitFor(() => expect(tiptap.getHTML()).not.toContain('drag_in_the_blank'));
  });

  it('stays hidden while an area that brings its own toolbar is selected', async () => {
    await selectArea('explicit-constructed-response', 'explicit_constructed_response');

    await waitFor(() => expect(document.querySelector('[role="toolbar"]')).toBeNull());
    const bar = document.querySelector('.pie-toolbar') as HTMLElement;
    expect(bar).not.toHaveClass('focused');
    expect(inert(bar)).toBe(true);
  });
});
