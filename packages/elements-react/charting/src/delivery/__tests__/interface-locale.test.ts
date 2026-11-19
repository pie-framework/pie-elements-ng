import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import { model as buildModel } from '../../controller/index.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Charting } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-charting-locale', Charting as unknown as CustomElementConstructor);

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

// An instructor evaluating: the teacher instructions and the key legend both render.
const mount = async (extra: object = {}, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-charting-locale') as Host;
  player.appendChild(el);
  const question = {
    chartType: 'bar',
    data: [{ label: 'A', value: 1, interactive: true, editable: false }],
    correctAnswer: { data: [{ label: 'A', value: 2, interactive: true, editable: false }] },
    teacherInstructionsEnabled: true,
    teacherInstructions: '<p>Notes</p>',
    ...extra,
  };
  el.model = await buildModel(question as never, { answer: [] } as never, { mode: 'evaluate', role: 'instructor' } as never);
  el.session = { answer: [] };
  return { el, publish };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('charting interface locale', () => {
  it('renders its chrome and the key legend in the player locale', async () => {
    const { el } = await mount({}, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain('Respuesta correcta del estudiante');
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = await mount({}, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Respuesta correcta del estudiante'));
    publish('nl-NL');
    await vi.waitFor(() => expect(el.textContent).toContain('Instructies voor de leraar weergeven'));
    expect(el.textContent).toContain('Juist antwoord van de leerling');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = await mount({}, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Respuesta correcta del estudiante'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = await mount({ language: 'es_ES' });
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.textContent).toContain('Respuesta correcta del estudiante');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = await mount();
    await vi.waitFor(() => expect(el.textContent).toContain('Show Teacher Instructions'));
    expect(el.textContent).toContain('Student correct answer');
  });
});
