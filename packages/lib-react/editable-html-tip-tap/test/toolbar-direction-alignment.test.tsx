import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the toolbar.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('../src/components/respArea/DragInTheBlank/DragInTheBlank.js', () => ({ default: () => null }));
vi.mock('../src/components/respArea/ExplicitConstructedResponse.js', () => ({ default: () => null }));

const { EditableHtml } = await import('../src/components/EditableHtml');
const { interfaceLocaleContext } = await import('@pie-element/shared-i18n');

const toolbarButton = (name: string) =>
  document.querySelector(`[role="toolbar"] button[aria-label="${name}"]`) as HTMLButtonElement;
const pressed = (name: string) => toolbarButton(name).getAttribute('aria-pressed');
// A click the keyboard synthesizes (Enter or Space) has `detail` 0.
const press = (button: HTMLElement, { keyboard = false } = {}) =>
  act(() => {
    fireEvent.click(button, { detail: keyboard ? 0 : 1 });
  });

// The first block's direction and alignment, as the saved markup declares them.
const firstBlock = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const block = template.content.firstElementChild as HTMLElement;
  return { dir: block.getAttribute('dir'), align: block.style.textAlign || null };
};

/** A stand-in player that answers the interface-locale subscription with `locale`. */
const player = (locale: string) => {
  const element = document.createElement('div');
  element.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context === interfaceLocaleContext) request.callback?.({ locale, direction: 'ltr' });
  });
  return document.body.appendChild(element);
};

const open = async ({ interfaceLocale, ...props }: Record<string, unknown>) => {
  let tiptap: any;
  render(
    <EditableHtml
      onChange={vi.fn()}
      editorRef={(instance: unknown) => {
        tiptap = instance;
      }}
      {...props}
    />,
    interfaceLocale ? { container: player(interfaceLocale as string) } : undefined,
  );
  const box = await waitFor(() => screen.getByRole('textbox'));
  await waitFor(() => expect(tiptap).toBeTruthy());
  act(() => box.focus());
  await waitFor(() => expect(document.querySelector('[role="toolbar"]')?.closest('[inert]')).toBeNull());
  return tiptap;
};

describe('paragraph direction buttons', () => {
  const LTR = 'Left-to-right paragraph';
  const RTL = 'Right-to-left paragraph';

  it('press the direction the block renders in', async () => {
    await open({ markup: '<p dir="rtl">مرحبا</p>', activePlugins: ['text-direction'] });
    expect(pressed(RTL)).toBe('true');
    expect(pressed(LTR)).toBe('false');
  });

  it('pin a block to a direction, and return it to its script’s when pressed again', async () => {
    const tiptap = await open({ markup: '<p>Hello</p>', activePlugins: ['text-direction'] });

    press(toolbarButton(RTL));
    expect(tiptap.getHTML()).toBe('<p dir="rtl">Hello</p>');
    await waitFor(() => expect(pressed(RTL)).toBe('true'));

    press(toolbarButton(RTL));
    expect(tiptap.getHTML()).toBe('<p>Hello</p>');
    await waitFor(() => expect(pressed(LTR)).toBe('true'));
  });

  it('are named in the item language', async () => {
    await open({ markup: '<p>Hola</p>', activePlugins: ['text-direction'], language: 'es_ES' });
    expect(toolbarButton('Párrafo de izquierda a derecha')).toBeTruthy();
    expect(toolbarButton('Párrafo de derecha a izquierda')).toBeTruthy();
  });

  it('are offered on a right-to-left field and left out of others', async () => {
    await open({ markup: '<p>Hello</p>' });
    expect(toolbarButton(RTL)).toBeNull();
    document.body.innerHTML = '';

    await open({ markup: '<p>مرحبا</p>', language: 'ar' });
    expect(toolbarButton(RTL)).toBeTruthy();
  });

  it('follow `pluginProps`, which can offer them anywhere or remove them from a right-to-left field', async () => {
    await open({ markup: '<p>Hello</p>', pluginProps: { textDirection: { disabled: false } } });
    expect(toolbarButton(RTL)).toBeTruthy();
    document.body.innerHTML = '';

    await open({ markup: '<p>مرحبا</p>', language: 'ar', pluginProps: { textDirection: { disabled: true } } });
    expect(toolbarButton(RTL)).toBeNull();
  });
});

describe('text alignment', () => {
  const TRIGGER = 'Text alignment';
  const options = () =>
    [...document.querySelectorAll('[role="toolbar"] [role="group"] button')] as HTMLButtonElement[];
  const group = () => document.querySelector('[role="toolbar"] [role="group"]') as HTMLElement;

  it('is a disclosure with no control inside its button', async () => {
    await open({ markup: '<p>Hello</p>', activePlugins: ['text-align'] });
    const trigger = toolbarButton(TRIGGER);

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('aria-controls', group().id);
    expect(trigger.querySelector('button, [role="button"]')).toBeNull();
    expect(group()).toHaveAttribute('hidden');
    expect(group()).toHaveAttribute('aria-label', TRIGGER);
    expect(options().map((b) => b.getAttribute('aria-label'))).toEqual([
      'Align to start',
      'Center',
      'Align to end',
      'Justify',
    ]);
  });

  it('opened from the keyboard, focuses the pressed alignment, and Escape returns to the button', async () => {
    await open({ markup: '<p style="text-align: center">Hello</p>', activePlugins: ['text-align'] });
    const trigger = toolbarButton(TRIGGER);
    act(() => trigger.focus());

    press(trigger, { keyboard: true });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(group()).not.toHaveAttribute('hidden');
    await waitFor(() => expect(document.activeElement).toBe(toolbarButton('Center')));
    expect(pressed('Center')).toBe('true');

    act(() => {
      fireEvent.keyDown(document.activeElement as Element, { key: 'Escape' });
    });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.activeElement).toBe(trigger);
  });

  it('sets start and end, which follow the block’s direction', async () => {
    const tiptap = await open({ markup: '<p>Hello</p>', activePlugins: ['text-align'] });

    press(toolbarButton(TRIGGER));
    press(toolbarButton('Align to end'));
    expect(firstBlock(tiptap.getHTML())).toEqual({ dir: null, align: 'end' });
    expect(toolbarButton(TRIGGER)).toHaveAttribute('aria-expanded', 'false');
    await waitFor(() => expect(pressed('Align to end')).toBe('true'));
  });

  it.each([
    ['<p style="text-align: right">Hello</p>', 'Align to end'],
    ['<p style="text-align: left">Hello</p>', 'Align to start'],
    ['<p dir="rtl" style="text-align: left">مرحبا</p>', 'Align to end'],
    ['<p dir="rtl" style="text-align: right">مرحبا</p>', 'Align to start'],
    ['<p dir="rtl">مرحبا</p>', 'Align to start'],
  ])('reads %s as %s, and keeps the saved value', async (markup, label) => {
    const tiptap = await open({ markup, activePlugins: ['text-align'] });
    expect(pressed(label)).toBe('true');
    expect(firstBlock(tiptap.getHTML())).toEqual(firstBlock(markup));
  });
});

describe('Arabic characters', () => {
  const ARABIC = 'Arabic characters (ع)';

  it('are offered when the field asks for the Arabic set', async () => {
    await open({
      markup: '<p>مرحبا</p>',
      activePlugins: ['languageCharacters'],
      languageCharactersProps: [{ language: 'arabic' }],
    });

    expect(toolbarButton('Spanish characters (ñ)')).toBeNull();
    press(toolbarButton(ARABIC));

    const keys = await waitFor(() => {
      const found = [...document.querySelectorAll('.insert-character-dialog button')];
      expect(found.length).toBeGreaterThan(10);
      return found.map((b) => b.getAttribute('aria-label'));
    });
    expect(keys).toEqual(expect.arrayContaining(['٠', '؟', 'RLM', 'LRM', 'ALM']));
    expect(keys).not.toContain('[object Object]');
  });

  it('are not offered otherwise', async () => {
    await open({ markup: '<p>Hola</p>', activePlugins: ['languageCharacters'] });
    expect(toolbarButton(ARABIC)).toBeNull();
  });
});

describe('content language', () => {
  it('declares the language and its direction on the text box, and follows a change to it', async () => {
    const { rerender } = render(<EditableHtml onChange={vi.fn()} markup="<p>12</p>" language="ar-sa" />);
    const box = await waitFor(() => screen.getByRole('textbox'));
    await waitFor(() => expect(box.getAttribute('lang')).toBe('ar-SA'));
    expect(box.getAttribute('dir')).toBe('rtl');

    rerender(<EditableHtml onChange={vi.fn()} markup="<p>12</p>" />);
    await waitFor(() => expect(box.hasAttribute('lang')).toBe(false));
    expect(box.hasAttribute('dir')).toBe(false);
  });

  it('stamps an edited block against the content language’s direction', async () => {
    const tiptap = await open({ markup: '<p>مرحبا</p><p>pH</p>', language: 'ar' });
    act(() => {
      tiptap.commands.insertContentAt(tiptap.state.doc.content.size - 1, ' 7');
      tiptap.commands.insertContentAt(1, '!');
    });
    expect(tiptap.getHTML()).toBe('<p>!مرحبا</p><p dir="ltr">pH 7</p>');
  });
});

describe('text language control', () => {
  const TRIGGER = 'Text language';
  // The options of the open language disclosure, whichever locale names its button.
  const options = () => {
    const trigger = document.querySelector('[role="toolbar"] button[aria-expanded="true"]');
    const group = trigger && document.getElementById(trigger.getAttribute('aria-controls')!);
    return [...(group?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
  };
  const option = (label: string | RegExp) => options().find((button) => button.textContent?.match(label));
  const selectWord = (tiptap: any, from: number, to: number) =>
    act(() => {
      tiptap.commands.setTextSelection({ from, to });
    });

  it('is left out of a field in one language', async () => {
    await open({ markup: '<p>Hello</p>', language: 'en_US', interfaceLocale: 'en-GB' });
    expect(toolbarButton(TRIGGER)).toBeNull();
  });

  it('marks the selection in the page’s language when it differs from the field’s', async () => {
    const tiptap = await open({ markup: '<p>Say merci</p>', language: 'en_US', interfaceLocale: 'fr-FR' });
    selectWord(tiptap, 5, 10);
    await waitFor(() => expect(toolbarButton('Text language')).toBeTruthy());
    press(toolbarButton(TRIGGER));
    expect(options().map((button) => button.textContent)).toEqual(['anglais américain', 'français (France)']);

    press(option('français')!);
    expect(tiptap.getHTML()).toBe('<p>Say <span lang="fr-FR" dir="ltr">merci</span></p>');
  });

  it('shows a span’s own language, and removes it', async () => {
    const tiptap = await open({ markup: '<p>Say <span lang="ar">مرحبا</span></p>', language: 'es_ES' });
    selectWord(tiptap, 6, 6);
    press(toolbarButton('Idioma del texto'));
    expect(options().map((button) => [button.textContent, button.getAttribute('aria-pressed')])).toEqual([
      ['ar', 'true'],
      [expect.stringMatching(/Spanish/), 'false'],
      ['Quitar idioma', null],
    ]);

    press(option('Quitar idioma')!);
    expect(tiptap.getHTML()).toBe('<p>Say مرحبا</p>');
  });
});

describe('contentLanguageChoices', () => {
  it('offers the field’s language and the page’s, each written language once', async () => {
    const { contentLanguageChoices } = await import('../src/utils/content-languages');
    const values = (field: string | null, page: string | null) =>
      contentLanguageChoices(field, page).map(({ value }) => value);

    expect(values('en_US', 'en-GB')).toEqual(['en-US']);
    expect(values('zh-TW', 'zh-CN')).toEqual(['zh-TW', 'zh-CN']);
    expect(values('es_ES', null)).toEqual(['es-ES']);
    expect(values(null, null)).toEqual([]);
  });
});
