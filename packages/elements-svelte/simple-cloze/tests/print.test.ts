/**
 * Print players set `el.options = config.options` and then `el.model = m` with
 * the authored model; `options.role` decides whether the answer key prints.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import SimpleClozePrint from '../src/print/index.js';

const TAG = 'simple-cloze-print--version-0-0-0-print-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, SimpleClozePrint as CustomElementConstructor);
}

const MODEL = {
  id: '1',
  element: 'simple-cloze',
  prompt: '<p>What is 2 + 2?</p>',
  promptEnabled: true,
  correctAnswer: 'Four',
};

async function render(options: Record<string, unknown> | undefined, model = MODEL) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.options = options;
  element.model = { ...model };
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return element as HTMLElement & { options: unknown; model: unknown };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('simple-cloze print', () => {
  it('prints the answer key for an instructor', async () => {
    const element = await render({ role: 'instructor' });

    expect(element.textContent).toContain('Four');
    expect(element.textContent).toContain('Correct answer');
  });

  it('prints a blank for a student', async () => {
    const element = await render({ role: 'student' });

    expect(element.textContent).not.toContain('Four');
    expect(element.textContent).toContain('What is 2 + 2?');
  });

  it('prints a blank when no options are set', async () => {
    const element = await render(undefined);

    expect(element.textContent).not.toContain('Four');
  });

  it('follows a role set after the model', async () => {
    const element = await render({ role: 'student' });

    element.options = { role: 'instructor' };
    flushSync();

    expect(element.textContent).toContain('Four');
  });

  it('omits the prompt when it is disabled', async () => {
    const element = await render({ role: 'student' }, { ...MODEL, promptEnabled: false });

    expect(element.textContent).not.toContain('What is 2 + 2?');
  });
});
