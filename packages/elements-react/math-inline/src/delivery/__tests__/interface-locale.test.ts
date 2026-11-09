import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('mathlive', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  MathfieldElement: (await import('./fake-mathlive')).FakeMathfieldElement,
}));

// Load MathLive before the first field mounts, as on a page that already shows math.
beforeAll(async () => {
  const { loadMathLive } = await import('@pie-lib/math-input-mathlive');
  await loadMathLive();
});

const { default: MathInline } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

const TAG = 'test-math-inline-interface-locale';
customElements.define(TAG, MathInline as unknown as CustomElementConstructor);

// The first render waits for MathLive's module graph to load.
const LOAD = { timeout: 10_000 };

/** A stand-in player; `publish` changes the locale it answers the element's subscription with. */
function mountPlayer(locale: string) {
  const player = document.createElement('div');
  const subscribers: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void; subscribe?: boolean };
    if (request.context !== interfaceLocaleContext || request.subscribe !== true || !request.callback) return;
    subscribers.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  return {
    player,
    publish: (next: string) => subscribers.forEach((callback) => callback({ locale: next, direction: 'ltr' })),
  };
}

// A view model as the controller hands it to delivery, for a student gathering.
const viewModel = (language?: string) => ({
  language,
  disabled: false,
  view: false,
  config: {
    id: '1',
    expression: '{{response}} + 1 = 2',
    responseType: 'Advanced Multi',
    responses: [],
    env: { mode: 'gather', role: 'student' },
  },
});

function mount(parent: HTMLElement, language?: string) {
  const el = document.createElement(TAG) as Host;
  parent.appendChild(el);
  el.model = viewModel(language);
  el.session = { answers: { r1: { value: '' } } };
  return el;
}

const heading = (el: Element) => el.querySelector('h2')?.textContent;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('math-inline interface locale', () => {
  it('renders the chrome in the player locale and keeps the content language', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, 'en_US');

    await vi.waitFor(() => expect(heading(el)).toBe('Pregunta de respuesta con ecuación matemática'), LOAD);
    expect(el.getAttribute('aria-label')).toBe('Pregunta de respuesta matemática');
    await vi.waitFor(() => expect(el.textContent).toContain('Este campo admite la entrada'), LOAD);
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  it('follows a locale change after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = mount(player);
    await vi.waitFor(() => expect(heading(el)).toBe('Math Equation Response Question'), LOAD);

    publish('es');

    await vi.waitFor(() => expect(heading(el)).toBe('Pregunta de respuesta con ecuación matemática'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de respuesta matemática');
  });

  it('stamps no lang on an item that declares none', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player);

    await vi.waitFor(() => expect(heading(el)).toBe('Pregunta de respuesta con ecuación matemática'), LOAD);
    expect(el.getAttribute('lang')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("renders a Spanish-declaring item's chrome in Spanish without a player", async () => {
    const el = mount(document.body, 'es_ES');

    await vi.waitFor(() => expect(heading(el)).toBe('Pregunta de respuesta con ecuación matemática'), LOAD);
    expect(el.getAttribute('aria-label')).toBe('Pregunta de respuesta matemática');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });
});
