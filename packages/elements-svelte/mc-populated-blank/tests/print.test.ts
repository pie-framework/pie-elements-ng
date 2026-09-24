/**
 * The print view. `pie-print` sets `options` and then the item's raw model on
 * each element; the key and teacher instructions print for an instructor only,
 * as multiple-choice prints them.
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

let element: any = null;

async function mount(options: Record<string, unknown>, model: Record<string, unknown> = MODEL) {
  element = document.createElement(TAG);
  document.body.appendChild(element);
  element.options = options;
  element.model = { ...model };
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return element as HTMLElement;
}

afterEach(() => {
  element?.remove();
  element = null;
});

describe('mc-populated-blank print', () => {
  it('prints no key and no teacher instructions for a student', async () => {
    const el = await mount({ role: 'student' });
    expect(el.textContent).toContain('Pick one');
    expect(el.textContent).not.toContain('(key)');
    expect(el.textContent).not.toContain('Read aloud.');
    expect(el.querySelector('.mpb-print-blank')?.textContent?.trim()).toBe('________');
  });

  it('prints the key and teacher instructions for an instructor', async () => {
    const el = await mount({ role: 'instructor' });
    expect(el.textContent).toContain('(key)');
    expect(el.textContent).toContain('Read aloud.');
    expect(el.querySelector('.mpb-print-blank')?.textContent?.trim()).toBe('look');
  });

  it('leaves the key out for an instructor when printAnswerKey is false', async () => {
    const el = await mount({ role: 'instructor' }, { ...MODEL, printAnswerKey: false });
    expect(el.textContent).not.toContain('(key)');
  });

  it('prints image choices as images', async () => {
    const el = await mount(
      { role: 'student' },
      {
        ...MODEL,
        choiceMode: 'image',
        choices: [
          { id: 'a', imageUrl: 'a.png', imageAlt: 'A cat' },
          { id: 'b', imageUrl: 'b.png', imageAlt: 'A dog' },
        ],
      }
    );
    const alts = [...el.querySelectorAll('.mpb-print-choices img')].map((img) =>
      img.getAttribute('alt')
    );
    expect(alts).toEqual(['A cat', 'A dog']);
    expect(el.querySelector('.mpb-print-choices')?.textContent).not.toContain('a');
  });

  it("prints its labels in the item's locale", async () => {
    const el = await mount({ role: 'instructor' }, { ...MODEL, locale: 'es_MX' });
    expect(el.textContent).toContain('(clave)');
  });

  it('prints teacher instructions when teacherInstructionsEnabled is unset', async () => {
    const { teacherInstructionsEnabled: _enabled, ...model } = MODEL;
    const el = await mount({ role: 'instructor' }, model);
    expect(el.textContent).toContain('Read aloud.');
  });
});
