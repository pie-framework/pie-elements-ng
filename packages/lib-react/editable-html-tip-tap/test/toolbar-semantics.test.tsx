import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the toolbar.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

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
