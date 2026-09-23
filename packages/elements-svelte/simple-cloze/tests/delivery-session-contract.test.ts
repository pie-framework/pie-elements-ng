/**
 * The session contract between this element and a player.
 *
 * A player creates each entry with `findOrAddSession(session, model.id,
 * model.element)`, hands that object to `element.session`, and reads the
 * learner's response back off the same object. It registers the element under a
 * versioned tag and stamps that tag on the entry as `element`; `TAG` stands in
 * for it. The rendered component mounts a microtask after connect.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
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
  document.body.innerHTML = '';
});

describe('simple-cloze session contract', () => {
  it("writes the response into the player's session object, keeping `id` and `element`", async () => {
    const { element, playerSession } = await mountRendered();

    type(element, '4');

    expect(playerSession).toEqual({ id: '1', element: TAG, response: '4' });
    expect(element.session.response).toBe('4');
  });

  it('writes neither `id` nor `element` when the player set none', async () => {
    const { element, playerSession } = await mountRendered({});

    type(element, '4');

    expect(playerSession).toEqual({ response: '4' });
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

    const replacement: Record<string, unknown> = { id: '2', element: TAG, response: '7' };
    element.session = replacement;
    flushSync();
    expect(input(element).value).toBe('7');

    type(element, '8');
    expect(replacement.response).toBe('8');
    expect(playerSession.response).toBe('4');
  });
});

describe('simple-cloze show correct answer', () => {
  const answered = () => ({ id: '1', element: TAG, response: '5' });

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
