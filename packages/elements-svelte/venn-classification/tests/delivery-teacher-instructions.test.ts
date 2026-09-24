/**
 * Teacher instructions in the rendered delivery element: the controller sends
 * them to instructors only, and they show collapsed, as multiple-choice shows them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: vi.fn() }));

import VennClassificationElement from '../src/delivery/index.js';
import { model as controllerModel } from '../src/controller/index.js';
import type { VennModel } from '../src/types.js';

const TAG = 'venn-classification--version-0-0-0-teacher-instructions-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, VennClassificationElement as unknown as CustomElementConstructor);
}

const QUESTION: VennModel = {
  id: '1',
  element: TAG,
  prompt: '<p>Sort each animal.</p>',
  circles: [{ label: 'Reptile' }, { label: 'Egg-layer' }],
  tiles: [{ id: 'frog', label: 'Frog', correctRegion: [1] }],
  teacherInstructions: '<p>Read aloud.</p>',
};

async function render(question: VennModel, env: { mode: string; role: string }) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  const session = { id: '1', element: TAG };
  element.session = session;
  element.model = await controllerModel(question, session, env);
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return element as HTMLElement;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('venn-classification teacher instructions', () => {
  it('shows an instructor the instructions behind a collapsed toggle', async () => {
    const element = await render(QUESTION, { mode: 'view', role: 'instructor' });
    const toggle = element.querySelector('.teacher-instructions-toggle') as HTMLButtonElement;
    const panel = element.querySelector('.teacher-instructions-content') as HTMLElement;

    expect(toggle.textContent?.trim()).toBe('Show Teacher Instructions');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.hidden).toBe(true);

    toggle.click();
    flushSync();
    expect(toggle.textContent?.trim()).toBe('Hide Teacher Instructions');
    expect(panel.hidden).toBe(false);
    expect(panel.textContent?.trim()).toBe('Read aloud.');
  });

  it("labels the toggle in the item's language", async () => {
    const element = await render(
      { ...QUESTION, language: 'es_ES' },
      { mode: 'view', role: 'instructor' }
    );

    expect(element.querySelector('.teacher-instructions-toggle')?.textContent?.trim()).toBe(
      'Mostrar instrucciones para el maestro'
    );
  });

  it('shows a student none', async () => {
    const element = await render(QUESTION, { mode: 'view', role: 'student' });

    expect(element.querySelector('.teacher-instructions')).toBeNull();
  });
});
