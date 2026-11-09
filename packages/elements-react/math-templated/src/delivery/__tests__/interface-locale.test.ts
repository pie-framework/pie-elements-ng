import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

// MathJax loads off a CDN, and the response areas have no bearing on the chrome or the note.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/mask-markup', () => ({ Customizable: () => null }));
vi.mock('@pie-lib/math-input-mathlive', () => ({
  mq: { Static: () => null },
  HorizontalKeypad: () => null,
  updateSpans: () => {},
  answerBlockLatex: () => '',
}));

const { default: MathTemplated } = await import('../index');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-math-templated-interface-locale', MathTemplated as unknown as CustomElementConstructor);

/** A stand-in player: answers the interface-locale subscription and can publish a new locale later. */
function mountPlayer(locale: string) {
  const player = document.createElement('div');
  const callbacks: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback) return;
    callbacks.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  return {
    player,
    publish: (next: string) => callbacks.forEach((cb) => cb({ locale: next, direction: 'ltr' })),
  };
}

const ENGLISH_NOTE =
  'Note: The answer shown above is the primary correct answer specified by the author for this item, but other answers may also be recognized as correct.';
const SPANISH_NOTE =
  'Nota: La respuesta que se muestra arriba es la respuesta correcta principal especificada por el autor para esta pregunta, pero también se pueden reconocer otras respuestas como correctas.';
const SPANISH_INSTRUCTIONS = 'Mostrar instrucciones para el maestro';

// An instructor's view of an item whose validation is not literal, so the note renders.
const model = {
  env: { mode: 'view', role: 'instructor' },
  markup: '',
  responses: {},
  showNote: true,
  teacherInstructions: '<p>Read aloud.</p>',
};

const create = (parent: HTMLElement, itemModel: object) => {
  const el = document.createElement('test-math-templated-interface-locale') as Host;
  parent.appendChild(el);
  el.model = itemModel;
  el.session = {};
  return el;
};

const noteText = (el: HTMLElement) => el.querySelector('.note')?.textContent;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('math-templated interface locale', () => {
  it('renders its chrome and default note in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = create(player, model);

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_INSTRUCTIONS));
    expect(noteText(el)).toBe(SPANISH_NOTE);
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, { ...model, language: 'en-US' });
    await vi.waitFor(() => expect(noteText(el)).toBe(ENGLISH_NOTE));

    publish('es');

    await vi.waitFor(() => expect(noteText(el)).toBe(SPANISH_NOTE));
    expect(el.textContent).toContain(SPANISH_INSTRUCTIONS);
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, { ...model, language: 'es_ES' });

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_INSTRUCTIONS));
    expect(noteText(el)).toBe(SPANISH_NOTE);
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body, model);

    await vi.waitFor(() => expect(noteText(el)).toBe(ENGLISH_NOTE));
    expect(el.textContent).toContain('Show Teacher Instructions');
    expect(el.getAttribute('lang')).toBeNull();
  });
});

describe('math-templated stored notes', () => {
  it.each([
    ['the English default', ENGLISH_NOTE],
    ['the unlabelled English default', ENGLISH_NOTE.replace('Note: ', '')],
    ['the English default in markup', `<p>${ENGLISH_NOTE}</p>`],
  ])('treat %s as absent', async (_name, note) => {
    const { player } = mountPlayer('es');
    const el = create(player, { ...model, note });

    await vi.waitFor(() => expect(noteText(el)).toBe(SPANISH_NOTE));
  });

  it("treat the item language's default as absent", async () => {
    const { player } = mountPlayer('en-US');
    const el = create(player, { ...model, language: 'es_ES', note: SPANISH_NOTE });

    await vi.waitFor(() => expect(noteText(el)).toBe(ENGLISH_NOTE));
  });

  it('keep an authored note', async () => {
    const { player } = mountPlayer('es');
    const el = create(player, { ...model, note: '<p>Equivalent fractions also count.</p>' });

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH_INSTRUCTIONS));
    expect(noteText(el)).toBe('Equivalent fractions also count.');
  });
});
