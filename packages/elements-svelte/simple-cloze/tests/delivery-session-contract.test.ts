/**
 * The session contract between this element and a player.
 *
 * A player creates each entry with `findOrAddSession(session, model.id,
 * model.element)`, hands that object to `element.session`, and reads the
 * learner's response back off the same object. It registers the element under a
 * versioned tag and stamps that tag on the entry as `element`; `TAG` stands in
 * for it. On load it sets `element.model = …; element.session = …` in one task,
 * once the controller has run. The rendered component mounts a microtask after
 * connect.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

const { renderMath } = vi.hoisted(() => ({ renderMath: vi.fn() }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath }));

import SimpleClozeElement from '../src/delivery/index.js';
import { model as buildViewModel } from '../src/controller/index.js';

const TAG = 'simple-cloze--version-0-0-0-session-contract-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, SimpleClozeElement as CustomElementConstructor);
}

const QUESTION = {
  id: '1',
  element: TAG,
  prompt: '<p>What is 2 + 2?</p>',
  correctAnswer: '4',
};

type Harness = {
  element: any;
  playerSession: Record<string, unknown>;
  atDocument: CustomEvent[];
  stop: () => void;
};

let harness: Harness | null = null;

async function mountRendered(
  playerSession: Record<string, unknown> = { id: '1', element: TAG },
  env: Record<string, unknown> = { mode: 'gather', role: 'student' }
): Promise<Harness> {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = await buildViewModel(QUESTION, playerSession, env);
  element.session = playerSession;

  const atDocument: CustomEvent[] = [];
  const listener = (event: Event) => atDocument.push(event as CustomEvent);
  document.addEventListener('session-changed', listener);
  harness = {
    element,
    playerSession,
    atDocument,
    stop: () => document.removeEventListener('session-changed', listener),
  };

  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return harness;
}

function input(element: HTMLElement): HTMLInputElement {
  const found = element.querySelector<HTMLInputElement>('input[type="text"]');
  if (!found) throw new Error('response input not rendered');
  return found;
}

function type(element: HTMLElement, value: string) {
  const field = input(element);
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

afterEach(() => {
  harness?.stop();
  harness = null;
  renderMath.mockReset();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

/** Every `model-set` and `session-changed` detail, in order, from creation on. */
function recordEvents() {
  const events: { type: string; complete: boolean }[] = [];
  const listener = (event: Event) =>
    events.push({ type: event.type, complete: (event as CustomEvent).detail.complete });
  document.addEventListener('model-set', listener);
  document.addEventListener('session-changed', listener);
  return {
    events,
    stop: () => {
      document.removeEventListener('model-set', listener);
      document.removeEventListener('session-changed', listener);
    },
  };
}

describe('simple-cloze session contract', () => {
  it("writes the response into the player's session object, keeping `id` and `element`", async () => {
    const { element, playerSession } = await mountRendered();

    type(element, '4');

    expect(playerSession).toEqual({ id: '1', element: TAG, value: '4' });
    expect(element.session.value).toBe('4');
  });

  it("returns the player's own session object after an update", async () => {
    const { element, playerSession } = await mountRendered();

    type(element, '4');

    expect(element.session).toBe(playerSession);
  });

  it('returns a replacement it could not write into a frozen session', async () => {
    const frozen = Object.freeze({ id: '1', element: TAG });
    const { element } = await mountRendered(frozen);

    type(element, '4');

    expect(element.session).toEqual({ id: '1', element: TAG, value: '4' });
    expect(frozen).toEqual({ id: '1', element: TAG });
  });

  it('reports a restored answered session as complete on model-set', async () => {
    const recorded = recordEvents();
    const playerSession = { id: '1', element: TAG, value: '4' };
    const element = document.createElement(TAG) as any;
    document.body.appendChild(element);

    const env = { mode: 'gather', role: 'student' };
    element.model = await buildViewModel(QUESTION, playerSession, env);
    element.session = playerSession;
    await settle();
    recorded.stop();

    expect(recorded.events).toContainEqual({ type: 'model-set', complete: true });
    expect(recorded.events).not.toContainEqual({ type: 'model-set', complete: false });
  });

  it('reports a restored complete session as complete after the model arrives', async () => {
    // As venn-classification: session, controller, model, the same session again.
    const recorded = recordEvents();
    const playerSession = { id: '1', element: TAG, value: '4' };
    const element = document.createElement(TAG) as any;
    document.body.appendChild(element);

    element.session = playerSession;
    element.model = await buildViewModel(QUESTION, playerSession, { mode: 'gather' });
    element.session = playerSession;
    await settle();
    recorded.stop();

    expect(recorded.events.filter((e) => e.type === 'session-changed').at(-1)).toEqual({
      type: 'session-changed',
      complete: true,
    });
  });

  it('writes neither `id` nor `element` when the player set none', async () => {
    const { element, playerSession } = await mountRendered({});

    type(element, '4');

    expect(playerSession).toEqual({ value: '4' });
  });

  it('announces the change under the player tag, with `complete` following the response', async () => {
    const { element, atDocument } = await mountRendered();

    type(element, '4');
    type(element, '   ');

    expect(atDocument.map((event) => event.detail)).toEqual([
      { complete: true, component: TAG },
      { complete: false, component: TAG },
    ]);
  });

  it('clears the input when the player resets the session', async () => {
    const { element } = await mountRendered();
    type(element, '4');

    element.session = { id: '1', element: TAG };
    flushSync();

    expect(input(element).value).toBe('');
  });

  it('shows and follows a replacement session', async () => {
    const { element, playerSession } = await mountRendered();
    type(element, '4');

    const replacement: Record<string, unknown> = { id: '2', element: TAG, value: '7' };
    element.session = replacement;
    flushSync();
    expect(input(element).value).toBe('7');

    type(element, '8');
    expect(replacement.value).toBe('8');
    expect(playerSession.value).toBe('4');
  });
});

describe('simple-cloze show correct answer', () => {
  const answered = () => ({ id: '1', element: TAG, value: '5' });

  function toggle(element: HTMLElement): HTMLButtonElement | null {
    return element.querySelector<HTMLButtonElement>('button[aria-pressed]');
  }

  it('reveals the answer key in evaluate mode for an incorrect response', async () => {
    const { element } = await mountRendered(answered(), { mode: 'evaluate', role: 'student' });

    toggle(element)?.click();
    flushSync();

    expect(input(element).value).toBe('4');
    expect(toggle(element)?.getAttribute('aria-pressed')).toBe('true');
  });

  it('reveals the answer key in evaluate mode for an unanswered response', async () => {
    const { element } = await mountRendered(
      { id: '1', element: TAG },
      { mode: 'evaluate', role: 'instructor' }
    );

    toggle(element)?.click();
    flushSync();

    expect(input(element).value).toBe('4');
    expect(toggle(element)?.getAttribute('aria-pressed')).toBe('true');
  });

  it('offers no reveal for a correct response', async () => {
    const { element } = await mountRendered(
      { id: '1', element: TAG, value: '4' },
      { mode: 'evaluate', role: 'student' }
    );

    expect(toggle(element)).toBeNull();
  });

  it('offers no reveal in view mode', async () => {
    const { element } = await mountRendered(answered(), { mode: 'view', role: 'instructor' });

    expect(toggle(element)).toBeNull();
    expect(input(element).disabled).toBe(true);
    expect(input(element).value).toBe('5');
  });

  it('drops the reveal when the player returns to gather mode', async () => {
    const session = answered();
    const { element } = await mountRendered(session, { mode: 'evaluate', role: 'student' });
    toggle(element)?.click();
    flushSync();

    element.model = await buildViewModel(QUESTION, session, { mode: 'gather', role: 'student' });
    flushSync();

    const field = input(element);
    expect(field.value).toBe('5');
    expect(field.readOnly).toBe(false);
    expect(field.disabled).toBe(false);
  });

  it('starts hidden again when the player returns to evaluate mode', async () => {
    const session = answered();
    const { element } = await mountRendered(session, { mode: 'evaluate', role: 'student' });
    toggle(element)?.click();
    flushSync();

    element.model = await buildViewModel(QUESTION, session, { mode: 'gather', role: 'student' });
    flushSync();
    element.model = await buildViewModel(QUESTION, session, { mode: 'evaluate', role: 'student' });
    flushSync();

    expect(toggle(element)?.getAttribute('aria-pressed')).toBe('false');
    expect(input(element).value).toBe('5');
  });
});

describe('simple-cloze math', () => {
  function prompt(element: HTMLElement): HTMLElement | null {
    return element.querySelector<HTMLElement>('.simple-cloze-prompt');
  }

  it('typesets the prompt', async () => {
    const { element } = await mountRendered();

    expect(renderMath).toHaveBeenCalledWith(prompt(element));
  });

  it('typesets a prompt the player changes', async () => {
    const session = { id: '1', element: TAG };
    const { element } = await mountRendered(session);
    renderMath.mockClear();

    element.model = await buildViewModel(
      { ...QUESTION, prompt: '<p>What is \\(\\frac{1}{2}\\)?</p>' },
      session,
      { mode: 'gather', role: 'student' }
    );
    flushSync();

    expect(renderMath).toHaveBeenCalledTimes(1);
    expect(prompt(element)?.innerHTML).toContain('\\frac{1}{2}');
  });

  it('does not typeset again for a new model with the same prompt', async () => {
    const session = { id: '1', element: TAG, value: '5' };
    const { element } = await mountRendered(session);
    renderMath.mockClear();

    element.model = await buildViewModel(QUESTION, session, { mode: 'evaluate', role: 'student' });
    flushSync();

    expect(renderMath).not.toHaveBeenCalled();
  });

  it('reports a MathJax load failure as a warning, not an unhandled rejection', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderMath.mockImplementation(() => Promise.reject(new Error('Failed to load MathJax')));

    await mountRendered();
    await settle();

    expect(warn).toHaveBeenCalledWith('simple-cloze: MathJax render failed', expect.any(Error));
  });
});
