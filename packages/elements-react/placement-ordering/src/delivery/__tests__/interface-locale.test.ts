import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: PlacementOrdering } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-placement-ordering-locale', PlacementOrdering as unknown as CustomElementConstructor);

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

// An instructor's view of an item with alternates, so the note renders.
const model = {
  choices: [
    { id: 'c1', label: 'Blueberry' },
    { id: 'c2', label: 'Lemon' },
  ],
  config: { orientation: 'vertical', includeTargets: true },
  correctResponse: ['c1', 'c2'],
  env: { mode: 'view', role: 'instructor' },
  disabled: true,
  showNote: true,
  teacherInstructions: '<p>Notes</p>',
};

const mount = (itemModel: object, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-placement-ordering-locale') as Host;
  player.appendChild(el);
  el.model = itemModel;
  el.session = {};
  return { el, publish };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('placement-ordering interface locale', () => {
  it('renders its chrome and drag instructions in the player locale', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain(SPANISH_NOTE);
    await vi.waitFor(() => expect(document.body.textContent).toContain('Presiona Espacio o Intro para tomar esta opción de respuesta.'));
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = mount(model, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_NOTE));
    publish('nl-NL');
    await vi.waitFor(() => expect(el.textContent).toContain(DUTCH_NOTE));
    expect(el.textContent).toContain('Instructies voor de leraar weergeven');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_NOTE));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = mount({ ...model, language: 'es_ES' });
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain(SPANISH_NOTE);
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = mount(model);
    await vi.waitFor(() => expect(el.textContent).toContain(ENGLISH_NOTE));
    await vi.waitFor(() => expect(document.body.textContent).toContain('Press Space or Enter to pick up this answer choice.'));
  });
});

describe('placement-ordering stored notes', () => {
  it.each([
    ['the English default', ENGLISH_NOTE],
    ['the unlabelled English default', ENGLISH_NOTE.replace('Note: ', '')],
    ['the English default in markup', `<p>${ENGLISH_NOTE}</p>`],
  ])('treat %s as absent', async (_name, note) => {
    const { el } = mount({ ...model, note }, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_NOTE));
    expect(el.textContent).not.toContain('The answer shown above');
  });

  it("treat the default in the item's declared language as absent", async () => {
    const spanish =
      'Nota: La respuesta que se muestra arriba es la respuesta correcta más común para esta pregunta. También se definen una o más respuestas correctas adicionales, y también se reconocerán como correctas.';
    const { el } = mount({ ...model, language: 'es_ES', note: spanish }, 'nl-NL');
    await vi.waitFor(() => expect(el.textContent).toContain(DUTCH_NOTE));
    expect(el.textContent).not.toContain('La respuesta');
  });

  it('keep an authored note', async () => {
    const { el } = mount({ ...model, note: 'Either order of the last two is accepted.' }, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain('Either order of the last two is accepted.');
    expect(el.textContent).not.toContain(SPANISH_NOTE);
  });
});
