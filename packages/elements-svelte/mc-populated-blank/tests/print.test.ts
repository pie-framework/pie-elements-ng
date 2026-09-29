/**
 * The print view. `pie-print` sets `options` and then the item's raw model on
 * each element; print renders delivery as a player shows that role in `view`
 * mode, so the key and teacher instructions print for an instructor only.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import McPopulatedBlankPrint from '../src/print/index.js';

const TAG = 'mc-populated-blank-print--version-0-0-0-print-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, McPopulatedBlankPrint as CustomElementConstructor);
}

const MODEL = {
  id: '1',
  element: 'mc-populated-blank',
  prompt: '<p>Pick one</p>',
  template: '<p>I {{blank}} at it.</p>',
  choiceMode: 'text',
  choices: [
    { id: 'a', labelHtml: 'louk' },
    { id: 'b', labelHtml: 'look' },
  ],
  correctChoiceId: 'b',
  interactionMode: 'populate_blank',
  teacherInstructionsEnabled: true,
  teacherInstructions: '<p>Read aloud.</p>',
};

const NBSP = String.fromCharCode(0xa0);

let element: any = null;

const settle = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
};

async function mount(
  options: Record<string, unknown> | null,
  model: Record<string, unknown> = MODEL
) {
  element = document.createElement(TAG);
  document.body.appendChild(element);
  if (options) element.options = options;
  element.model = { ...model };
  await settle();
  return element as HTMLElement;
}

const blank = (el: HTMLElement) => el.querySelector('.pie-blank-slot') as HTMLElement;
const radios = (el: HTMLElement) =>
  [...el.querySelectorAll('input[type="radio"]')] as HTMLInputElement[];
const checkedValues = (el: HTMLElement) =>
  radios(el)
    .filter((r) => r.checked)
    .map((r) => r.value);

afterEach(() => {
  element?.remove();
  element = null;
});

describe('mc-populated-blank print', () => {
  it('prints no key and no teacher instructions for a student', async () => {
    const el = await mount({ role: 'student' });
    expect(el.textContent).toContain('Pick one');
    expect(el.textContent).not.toContain('Read aloud.');
    expect(blank(el).querySelector('.cloze-marker-value')).toBeNull();
    expect(checkedValues(el)).toEqual([]);
  });

  it('prints the key and teacher instructions for an instructor', async () => {
    const el = await mount({ role: 'instructor' });
    expect(el.textContent).toContain('Read aloud.');
    expect(el.querySelector('.teacher-instructions-toggle')).toBeNull();
    expect(blank(el).textContent?.trim()).toBe('look');
    expect(checkedValues(el)).toEqual(['b']);
  });

  it('prints no key when no options are set', async () => {
    const el = await mount(null);
    expect(el.textContent).not.toContain('Read aloud.');
    expect(checkedValues(el)).toEqual([]);
  });

  it('follows a role set after the model', async () => {
    const el = await mount({ role: 'student' });
    element.options = { role: 'instructor' };
    await settle();
    expect(blank(el).textContent?.trim()).toBe('look');
  });

  it('leaves the key out for an instructor when printAnswerKey is false', async () => {
    const el = await mount({ role: 'instructor' }, { ...MODEL, printAnswerKey: false });
    expect(el.textContent).toContain('Read aloud.');
    expect(blank(el).querySelector('.cloze-marker-value')).toBeNull();
    expect(checkedValues(el)).toEqual([]);
  });

  it('prints the choices disabled', async () => {
    const el = await mount({ role: 'student' });
    expect(radios(el)).toHaveLength(2);
    expect(radios(el).every((r) => r.disabled)).toBe(true);
  });

  it('prints a student the authored choice order when the choices shuffle', async () => {
    const choices = 'abcdefgh'.split('').map((id) => ({ id, labelHtml: id }));
    const el = await mount({ role: 'student' }, { ...MODEL, choices, lockChoiceOrder: false });
    expect(radios(el).map((r) => r.value)).toEqual('abcdefgh'.split(''));
  });

  it('prints image choices as images, and the key image in the blank', async () => {
    const el = await mount(
      { role: 'instructor' },
      {
        ...MODEL,
        choiceMode: 'image',
        choices: [
          { id: 'a', imageUrl: 'a.png', imageAlt: 'A cat' },
          { id: 'b', imageUrl: 'b.png', imageAlt: 'A dog' },
        ],
      }
    );
    const alts = [...el.querySelectorAll('.pie-choices img')].map((img) => img.getAttribute('alt'));
    expect(alts).toEqual(['A cat', 'A dog']);
    expect(blank(el).querySelector('img')?.getAttribute('alt')).toBe('A dog');
  });

  it('keeps the blank glued to its neighbours in an inline sentence', async () => {
    const el = await mount(
      { role: 'student' },
      { ...MODEL, layoutProfile: 'inline_sentence', template: '<p>Read the word:{{blank}}.</p>' }
    );
    const text = el.querySelector('.pie-template-line')?.textContent || '';
    expect(text).toContain(`word:${NBSP}`);
    expect(text.endsWith(`${NBSP}.`)).toBe(true);
  });

  it('prints the audio as its URL and transcript, with no player', async () => {
    const el = await mount(
      { role: 'student' },
      { ...MODEL, hasAudio: true, audioUrl: 'https://a.test/x.mp3', audioTranscript: 'Say look.' }
    );
    expect(el.textContent).toContain('https://a.test/x.mp3');
    expect(el.textContent).toContain('Say look.');
    expect(el.querySelector('audio, .pie-listen-button')).toBeNull();
  });

  it("prints its labels in the item's locale", async () => {
    const el = await mount(
      { role: 'student' },
      { ...MODEL, locale: 'es_MX', hasAudio: true, audioUrl: 'x.mp3', audioTranscript: 'Di.' }
    );
    expect(el.textContent).toContain('Transcripción:');
  });

  it('omits the prompt when it is disabled', async () => {
    const el = await mount({ role: 'student' }, { ...MODEL, promptEnabled: false });
    expect(el.textContent).not.toContain('Pick one');
  });

  it('prints teacher instructions when teacherInstructionsEnabled is unset', async () => {
    const { teacherInstructionsEnabled: _enabled, ...model } = MODEL;
    const el = await mount({ role: 'instructor' }, model);
    expect(el.textContent).toContain('Read aloud.');
  });
});
