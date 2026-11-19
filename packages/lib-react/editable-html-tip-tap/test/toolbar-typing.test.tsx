import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, createEvent, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('../src/components/respArea/DragInTheBlank/DragInTheBlank.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/ExplicitConstructedResponse.js', () => ({ default: () => null }));

const { EditableHtml } = await import('../src/components/EditableHtml');
const { interfaceLocaleContext } = await import('@pie-element/shared-i18n');

/** A stand-in player that answers the interface-locale subscription with `locale`. */
const player = (locale: string) => {
  const element = document.createElement('div');
  element.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context === interfaceLocaleContext) request.callback?.({ locale, direction: 'ltr' });
  });
  return document.body.appendChild(element);
};

const SPANISH = 'Spanish characters (ñ)';
const toolbarButton = (name: string) =>
  document.querySelector(`[role="toolbar"] button[aria-label="${name}"]`) as HTMLButtonElement;
const panelButtons = () =>
  [...(document.querySelector('.insert-character-dialog')?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
// `altGraph` is the AltGr key's state. happy-dom reports AltGraph whenever Alt is held, which a
// browser does not, so the tests that hold Alt set it themselves.
const key = (k: string, { altGraph, ...opts }: Record<string, unknown> = {}) => {
  const event = createEvent.keyDown(document.activeElement as Element, { key: k, ...opts });
  if (altGraph !== undefined) {
    const getModifierState = event.getModifierState.bind(event);
    Object.defineProperty(event, 'getModifierState', {
      value: (name: string) => (name === 'AltGraph' ? altGraph : getModifierState(name)),
    });
  }
  let notPrevented = true;
  act(() => {
    notPrevented = fireEvent(document.activeElement as Element, event);
  });
  return notPrevented;
};

const setup = async ({ interfaceLocale, ...props }: Record<string, unknown> = {}) => {
  let tiptap: any;
  render(
    <EditableHtml
      markup="<p>Hola</p>"
      onChange={vi.fn()}
      activePlugins={['languageCharacters', 'bulleted-list', 'bold']}
      languageCharactersProps={[{ language: 'spanish' }]}
      editorRef={(instance: unknown) => {
        tiptap = instance;
      }}
      {...props}
    />,
    interfaceLocale ? { container: player(interfaceLocale as string) } : undefined,
  );
  const box = await waitFor(() => screen.getByRole('textbox'));
  act(() => box.focus());
  await waitFor(() => expect(document.querySelector('[role="toolbar"]')?.closest('[inert]')).toBeNull());
  act(() => {
    tiptap.commands.setTextSelection(3);
  });
  return tiptap;
};

describe('typing while the formatting toolbar has focus', () => {
  it('inserts letters, digits and punctuation at the cursor and keeps focus on the button', async () => {
    const tiptap = await setup();
    const button = toolbarButton('Bulleted list');
    act(() => button.focus());

    for (const k of ['a', '7', '!']) expect(key(k)).toBe(false);

    expect(tiptap.getText()).toBe('Hoa7!la');
    expect(document.activeElement).toBe(button);
  });

  it('inserts capitals and shifted punctuation', async () => {
    const tiptap = await setup();
    act(() => toolbarButton('Bulleted list').focus());

    for (const k of ['A', '?']) expect(key(k, { shiftKey: true })).toBe(false);

    expect(tiptap.getText()).toBe('HoA?la');
  });

  it('inserts an AltGr character', async () => {
    const tiptap = await setup();
    act(() => toolbarButton('Bulleted list').focus());
    // AltGr is reported as Ctrl+Alt.
    expect(key('ñ', { ctrlKey: true, altKey: true, altGraph: true })).toBe(false);

    expect(tiptap.getText()).toBe('Hoñla');
  });

  it('leaves space, Enter, the arrows and shortcuts to the toolbar', async () => {
    const tiptap = await setup();
    act(() => toolbarButton('Bulleted list').focus());

    for (const opts of [
      { key: ' ' },
      { key: 'Enter' },
      { key: 'Enter', shiftKey: true },
      { key: 'Tab' },
      { key: 'a', ctrlKey: true },
      { key: 'b', metaKey: true },
      { key: 'f', altKey: true, altGraph: false },
    ]) {
      expect(key(opts.key, opts)).toBe(true);
    }

    expect(tiptap.getText()).toBe('Hola');
  });

  it('moves focus along the toolbar with the arrows, without moving the cursor', async () => {
    const tiptap = await setup();
    const buttons = [...document.querySelectorAll('[role="toolbar"] button')] as HTMLButtonElement[];
    const first = buttons.indexOf(toolbarButton('Bulleted list'));
    act(() => buttons[first].focus());

    key('ArrowRight');
    expect(document.activeElement).toBe(buttons[first + 1]);

    key('ArrowLeft');
    expect(document.activeElement).toBe(buttons[first]);

    key('x');
    expect(tiptap.getText()).toBe('Hoxla');
  });

  it('inserts typed characters from inside the character panel', async () => {
    const tiptap = await setup();
    const trigger = toolbarButton(SPANISH);
    act(() => trigger.focus());
    act(() => {
      fireEvent.click(trigger, { detail: 0 });
    });
    await waitFor(() => expect(panelButtons().length).toBeGreaterThan(5));
    await waitFor(() => expect(document.activeElement).toBe(panelButtons()[0]));

    key('b');

    expect(tiptap.getText()).toBe('Hobla');
    expect(document.activeElement).toBe(panelButtons()[0]);
  });

  it('keeps a mark pressed from the toolbar on the typed characters', async () => {
    const tiptap = await setup();
    const bold = toolbarButton('Bold');
    act(() => bold.focus());
    act(() => {
      fireEvent.click(bold, { detail: 0 });
    });

    key('x');

    expect(tiptap.getHTML()).toBe('<p>Ho<strong>x</strong>la</p>');
  });

  it('keeps an open option group open, with focus on the option', async () => {
    const tiptap = await setup({ markup: '<p>Say merci</p>', language: 'en_US', interfaceLocale: 'fr-FR' });
    const trigger = await waitFor(() => {
      // Labelled in the page's language.
      const button = toolbarButton('Langue du texte');
      expect(button).toBeTruthy();
      return button;
    });
    act(() => trigger.focus());
    act(() => {
      fireEvent.click(trigger, { detail: 0 });
    });
    await waitFor(() => expect(trigger).toHaveAttribute('aria-expanded', 'true'));
    const option = document.activeElement;

    key('x');

    expect(tiptap.getText()).toBe('Saxy merci');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(document.activeElement).toBe(option);
  });

  it('does not take input meant for a field in a dialog', async () => {
    const tiptap = await setup();
    const input = document.createElement('input');
    document.querySelector('[role="toolbar"]')!.appendChild(input);
    act(() => input.focus());

    expect(key('a')).toBe(true);
    expect(tiptap.getText()).toBe('Hola');
  });
});
