/**
 * What assistive technology gets from the rendered delivery element: an input
 * named by the prompt, and evaluate-mode correctness as text, not colour alone.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: vi.fn() }));

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
      { id: '1', element: TAG, value: '5' },
      { mode: 'evaluate' }
    );

    expect(describedBy(input)).toBe('Incorrect');
  });

  it('describes a correct response as text', async () => {
    const { input } = await render(
      QUESTION,
      { id: '1', element: TAG, value: '4' },
      { mode: 'evaluate' }
    );

    expect(describedBy(input)).toBe('Correct');
  });

  it('describes an unanswered response as text', async () => {
    const { input } = await render(QUESTION, { id: '1', element: TAG }, { mode: 'evaluate' });

    expect(describedBy(input)).toBe('No answer');
  });

  it('adds no correctness description outside evaluate mode', async () => {
    const { input } = await render(
      QUESTION,
      { id: '1', element: TAG, value: '5' },
      { mode: 'gather' }
    );

    expect(describedBy(input)).toBe('');
  });

  it('hides decorative icons from assistive technology', async () => {
    const { element } = await render(
      QUESTION,
      { id: '1', element: TAG, value: '5' },
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
      { id: '1', element: TAG, value: '5' },
      { mode: 'evaluate' }
    );

    expect(element.querySelector('.simple-cloze-toggle-label')?.textContent?.trim()).toBe(
      'Mostrar respuesta correcta'
    );
  });

  it('shows an instructor the teacher instructions behind a collapsed toggle', async () => {
    const { element } = await render(
      { ...QUESTION, teacherInstructions: '<p>Read aloud.</p>' },
      { id: '1', element: TAG },
      { mode: 'view', role: 'instructor' }
    );
    const toggle = element.querySelector('.teacher-instructions-toggle') as HTMLButtonElement;
    const panel = element.querySelector('.teacher-instructions-content') as HTMLElement;

    expect(toggle.textContent?.trim()).toBe('Show Teacher Instructions');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);

    toggle.click();
    flushSync();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(panel.hidden).toBe(false);
    expect(panel.textContent?.trim()).toBe('Read aloud.');
  });

  it('shows a student no teacher instructions', async () => {
    const { element } = await render(
      { ...QUESTION, teacherInstructions: '<p>Read aloud.</p>' },
      { id: '1', element: TAG },
      { mode: 'view', role: 'student' }
    );

    expect(element.querySelector('.teacher-instructions')).toBeNull();
  });
});
