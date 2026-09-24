/**
 * The delivery element through its rendered component: what it shows for the
 * session and model a player sets. The session contract every Svelte element
 * shares is tested in `@pie-lib/delivery-events-svelte`.
 *
 * `TAG` stands in for the versioned tag a player registers the element under.
 * The rendered component mounts a microtask after connect.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

const { renderMath } = vi.hoisted(() => ({ renderMath: vi.fn() }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath }));

import SimpleClozeElement from '../src/delivery/index.js';
import { model as buildViewModel } from '../src/controller/index.js';

const TAG = 'simple-cloze--version-0-0-0-delivery-test';
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
};

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

async function mountRendered(
  playerSession: Record<string, unknown> = { id: '1', element: TAG },
  env: Record<string, unknown> = { mode: 'gather', role: 'student' }
): Promise<Harness> {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = await buildViewModel(QUESTION, playerSession, env);
  element.session = playerSession;
  await settle();
  return { element, playerSession };
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
  renderMath.mockReset();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('simple-cloze session', () => {
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
