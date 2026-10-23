import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the picker.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('../src/components/respArea/DragInTheBlank/DragInTheBlank.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/ExplicitConstructedResponse.js', () => ({ default: () => null }));

const { EditableHtml } = await import('../src/components/EditableHtml');

// The Spanish panel is a 5 x 4 grid of characters followed by its Done button.
const COLUMNS = 5;
const SPANISH = 'Spanish characters (ñ)';

const dialog = () => document.querySelector('.insert-character-dialog') as HTMLElement | null;
const panelButtons = () => [...(dialog()?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
const toolbarButton = (name: string) =>
  document.querySelector(`[role="toolbar"] button[aria-label="${name}"]`) as HTMLButtonElement;
const key = (k: string, opts: Record<string, unknown> = {}) =>
  act(() => {
    fireEvent.keyDown(document.activeElement as Element, { key: k, ...opts });
  });

// Opens the Spanish panel from its toolbar button. A click the keyboard synthesises (Enter or
// Space) has `detail` 0; a pointer click counts its presses from 1.
const openPanel = async ({ keyboard = true } = {}) => {
  let tiptap: any;
  render(
    <>
      <EditableHtml
        markup="<p>Hola</p>"
        onChange={vi.fn()}
        activePlugins={['languageCharacters', 'bulleted-list']}
        languageCharactersProps={[{ language: 'spanish' }]}
        editorRef={(instance: unknown) => {
          tiptap = instance;
        }}
      />
      <button type="button">After</button>
    </>,
  );

  const box = await waitFor(() => screen.getByRole('textbox'));
  act(() => box.focus());
  await waitFor(() => expect(toolbarButton(SPANISH).closest('[inert]')).toBeNull());

  const trigger = toolbarButton(SPANISH);
  act(() => trigger.focus());
  act(() => {
    fireEvent.click(trigger, { detail: keyboard ? 0 : 1 });
  });
  await waitFor(() => expect(panelButtons().length).toBeGreaterThan(COLUMNS));

  return { trigger, tiptap };
};

describe('Insert Spanish/Special Character panel keyboard access', () => {
  it('moves focus to the first character when opened from the keyboard', async () => {
    await openPanel();

    await waitFor(() => expect(document.activeElement).toBe(panelButtons()[0]));
  });

  it('leaves focus where it is when opened with the pointer', async () => {
    const { trigger } = await openPanel({ keyboard: false });

    expect(document.activeElement).toBe(trigger);
  });

  it('sits right after its toolbar button in the tab order', async () => {
    const { trigger } = await openPanel({ keyboard: false });
    const buttons = panelButtons();

    key('Tab');
    expect(document.activeElement).toBe(buttons[0]);

    key('Tab', { shiftKey: true });
    expect(document.activeElement).toBe(trigger);

    // From the last button, the panel's Done, Tab goes on to the toolbar button after the trigger.
    act(() => buttons[buttons.length - 1].focus());
    key('Tab');
    expect(document.activeElement).toBe(toolbarButton('Bulleted list'));
  });

  it('closes on Escape and returns focus to its toolbar button', async () => {
    const { trigger } = await openPanel();
    await waitFor(() => expect(document.activeElement).toBe(panelButtons()[0]));

    key('Escape');

    await waitFor(() => expect(dialog()).toBeNull());
    expect(document.activeElement).toBe(trigger);
    expect(trigger.closest('[inert]')).toBeNull();
  });

  it('returns focus to its toolbar button when closed with Done', async () => {
    const { trigger } = await openPanel();
    const buttons = panelButtons();

    act(() => {
      fireEvent.click(buttons[buttons.length - 1]);
    });

    await waitFor(() => expect(dialog()).toBeNull());
    expect(document.activeElement).toBe(trigger);
  });

  it('moves focus between its buttons with the arrow keys, wrapping at the ends', async () => {
    await openPanel();
    const buttons = panelButtons();
    await waitFor(() => expect(document.activeElement).toBe(buttons[0]));

    key('ArrowRight');
    expect(document.activeElement).toBe(buttons[1]);

    key('ArrowLeft');
    key('ArrowLeft');
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);

    key('ArrowRight');
    key('ArrowDown');
    expect(document.activeElement).toBe(buttons[COLUMNS]);

    key('ArrowUp');
    key('ArrowUp');
    expect(document.activeElement).toBe(buttons[buttons.length - COLUMNS]);
  });

  it('inserts a character and keeps focus on its button', async () => {
    const { tiptap } = await openPanel();
    const first = panelButtons()[0];
    await waitFor(() => expect(document.activeElement).toBe(first));

    act(() => {
      fireEvent.click(first, { detail: 0 });
    });

    await waitFor(() => expect(tiptap.getText()).toContain('á'));
    expect(document.activeElement).toBe(first);
    expect(dialog()).not.toBeNull();
  });
});
