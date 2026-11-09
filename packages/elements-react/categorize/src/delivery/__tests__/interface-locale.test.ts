import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';
import type { PieEnvironment } from '@pie-element/shared-types';

import Categorize from '../index';
import { model as buildModel } from '../../controller/index';
import type { CategorizeModel } from '../../types';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-categorize-locale', Categorize as unknown as CustomElementConstructor);

/** A stand-in player: answers the element's interface-locale subscription, and republishes on `publish`. */
function mountPlayer(locale?: string) {
  const player = document.createElement('div');
  const callbacks: ((value: unknown) => void)[] = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback || !locale) return;
    callbacks.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  const publish = (next: string) => {
    for (const callback of callbacks) callback({ locale: next, direction: 'ltr' });
  };
  return { player, publish };
}

const ENGLISH_NOTE =
  'Note: The answer shown above is the most common correct answer for this item. One or more additional correct answers are also defined, and will also be recognized as correct.';
const SPANISH_NOTE = 'Nota: La respuesta que se muestra arriba es la respuesta correcta más común para esta pregunta.';
const DUTCH_NOTE = 'Opmerking: het antwoord hierboven is het meest voorkomende juiste antwoord voor deze opgave.';

// An item with an alternate correct answer, evaluated unanswered: showing the correct answer shows the note.
const question = (extra: object = {}) => ({
  lockChoiceOrder: true,
  categories: [
    { id: '0', label: 'Even' },
    { id: '1', label: 'Odd' },
  ],
  choices: [
    { id: '0', content: 'Two', categoryCount: 1 },
    { id: '1', content: 'Three', categoryCount: 1 },
  ],
  correctResponse: [
    { category: '0', choices: ['0'], alternateResponses: [['1']] },
    { category: '1', choices: ['1'], alternateResponses: [['0']] },
  ],
  teacherInstructionsEnabled: true,
  teacherInstructions: '<p>Notes</p>',
  ...extra,
});

const mount = async (extra: object = {}, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-categorize-locale') as Host;
  player.appendChild(el);
  el.model = await buildModel(
    question(extra) as CategorizeModel,
    { answers: [] },
    { mode: 'evaluate', role: 'instructor' } as PieEnvironment,
    vi.fn(),
  );
  el.session = { answers: [] };
  const toggle = await vi.waitFor(() => {
    const button = el.querySelector<HTMLElement>('[aria-pressed]');
    if (!button) throw new Error('no correct-answer toggle yet');
    return button;
  });
  toggle.click();
  return { el, publish };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('categorize interface locale', () => {
  it('renders its chrome and the alternates note in the player locale', async () => {
    const { el } = await mount({}, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain(SPANISH_NOTE);
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = await mount({}, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_NOTE));
    publish('nl-NL');
    await vi.waitFor(() => expect(el.textContent).toContain('Instructies voor de leraar weergeven'));
    // New props reset the correct-answer view, so show it again.
    el.querySelector<HTMLElement>('[aria-pressed]')?.click();
    await vi.waitFor(() => expect(el.textContent).toContain(DUTCH_NOTE));
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = await mount({}, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_NOTE));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = await mount({ language: 'es_ES' });
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain(SPANISH_NOTE);
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = await mount();
    await vi.waitFor(() => expect(el.textContent).toContain(ENGLISH_NOTE));
  });
});

describe('categorize stored notes', () => {
  it('treat the English default as absent', async () => {
    const { el } = await mount({ note: ENGLISH_NOTE }, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_NOTE));
    expect(el.textContent).not.toContain('The answer shown above');
  });

  it('keep an authored note', async () => {
    const { el } = await mount({ note: 'Two and three may swap places.' }, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain('Two and three may swap places.');
    expect(el.textContent).not.toContain(SPANISH_NOTE);
  });
});
