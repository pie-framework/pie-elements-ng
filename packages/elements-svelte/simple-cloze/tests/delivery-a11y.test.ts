/**
 * What assistive technology gets from the rendered delivery element: an input
 * named by the prompt, and evaluate-mode correctness as text, not colour alone.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import SimpleClozeElement from '../src/delivery/index.js';
import { model as buildViewModel } from '../src/controller/index.js';

const TAG = 'simple-cloze--version-0-0-0-a11y-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, SimpleClozeElement as CustomElementConstructor);
}

const QUESTION = { id: '1', element: TAG, prompt: '<p>What is 2 + 2?</p>', correctAnswer: '4' };

async function render(
  question: Record<string, unknown>,
  session: Record<string, unknown>,
  env: Record<string, unknown>
) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = await buildViewModel(question, session, env);
  element.session = session;
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  const input = element.querySelector('input[type="text"]') as HTMLInputElement;
  return { element: element as HTMLElement, input };
}

function describedBy(input: HTMLInputElement): string {
  return (input.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .join(' ');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('simple-cloze accessibility', () => {
  it('names the input by the prompt', async () => {
    const { input } = await render(QUESTION, { id: '1', element: TAG }, { mode: 'gather' });

    const labelId = input.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    expect(document.getElementById(labelId as string)?.textContent).toContain('What is 2 + 2?');
  });

  it('gives each instance its own prompt id', async () => {
    const first = await render(QUESTION, { id: '1', element: TAG }, { mode: 'gather' });
    const second = await render(QUESTION, { id: '2', element: TAG }, { mode: 'gather' });

    expect(first.input.getAttribute('aria-labelledby')).not.toBe(
      second.input.getAttribute('aria-labelledby')
    );
  });

  it('falls back to a label when the prompt is disabled', async () => {
    const { input } = await render(
      { ...QUESTION, promptEnabled: false },
      { id: '1', element: TAG },
      { mode: 'gather' }
    );

    expect(input.hasAttribute('aria-labelledby')).toBe(false);
    expect(input.getAttribute('aria-label')).toBeTruthy();
  });

  it('turns spellcheck off', async () => {
    const { input } = await render(QUESTION, { id: '1', element: TAG }, { mode: 'gather' });

    expect(input.getAttribute('spellcheck')).toBe('false');
  });

  it('describes an incorrect response as text', async () => {
    const { input } = await render(
      QUESTION,
      { id: '1', element: TAG, response: '5' },
      { mode: 'evaluate' }
    );

    expect(describedBy(input)).toBe('Incorrect');
  });

  it('describes a correct response as text', async () => {
    const { input } = await render(
      QUESTION,
      { id: '1', element: TAG, response: '4' },
      { mode: 'evaluate' }
    );

    expect(describedBy(input)).toBe('Correct');
  });

  it('adds no correctness description outside evaluate mode', async () => {
    const { input } = await render(
      QUESTION,
      { id: '1', element: TAG, response: '5' },
      { mode: 'gather' }
    );

    expect(describedBy(input)).toBe('');
  });

  it('hides decorative icons from assistive technology', async () => {
    const { element } = await render(
      QUESTION,
      { id: '1', element: TAG, response: '5' },
      { mode: 'evaluate' }
    );

    const svgs = Array.from(element.querySelectorAll('svg'));
    expect(svgs.length).toBeGreaterThan(0);
    for (const svg of svgs) {
      expect(svg.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('labels the correct-answer toggle in the item language', async () => {
    const { element } = await render(
      { ...QUESTION, language: 'es_ES' },
      { id: '1', element: TAG, response: '5' },
      { mode: 'evaluate' }
    );

    expect(element.querySelector('.simple-cloze-toggle-label')?.textContent?.trim()).toBe(
      'Mostrar respuesta correcta'
    );
  });
});
