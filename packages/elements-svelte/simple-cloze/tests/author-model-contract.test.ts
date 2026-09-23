/**
 * The authoring contract between this element and a player. An authoring
 * player listens for `model.updated` at its root, so each edit must bubble out
 * of the element as that event, carrying the whole model: the fields the form
 * does not edit, `id` and the player's versioned `element` included.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import SimpleClozeAuthor from '../src/author/index.js';

const TAG = 'simple-cloze-config--version-0-0-0-author-contract-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, SimpleClozeAuthor as CustomElementConstructor);
}

const MODEL = {
  id: '1',
  element: 'simple-cloze--version-0-0-0',
  prompt: '<p>Fill in</p>',
  correctAnswer: 'look',
  rationale: '<p>Kept</p>',
};

let root: HTMLElement | null = null;

async function mount() {
  root = document.createElement('div');
  document.body.appendChild(root);
  const updates: CustomEvent[] = [];
  root.addEventListener('model.updated', (e) => updates.push(e as CustomEvent), true);
  const element = document.createElement(TAG) as any;
  root.appendChild(element);
  element.model = { ...MODEL };
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return { element, updates };
}

function typeAnswer(element: HTMLElement, value: string) {
  const input = element.querySelector('input[type="text"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

afterEach(() => {
  root?.remove();
  root = null;
});

describe('simple-cloze author model contract', () => {
  it('announces an edit at the player root with the whole model', async () => {
    const { element, updates } = await mount();
    typeAnswer(element, 'looks');

    expect(updates).toHaveLength(1);
    expect(updates[0].detail).toEqual({
      update: { ...MODEL, correctAnswer: 'looks' },
      reset: false,
    });
    expect(element.model).toEqual({ ...MODEL, correctAnswer: 'looks' });
  });

  it('builds each edit on the previous one', async () => {
    const { element, updates } = await mount();
    typeAnswer(element, 'looks');
    typeAnswer(element, 'looked');

    expect(updates.at(-1)?.detail.update).toEqual({ ...MODEL, correctAnswer: 'looked' });
  });

  it('calls an onChange callback without recursing into its own setter', async () => {
    const { element } = await mount();
    const onChange = vi.fn();
    element.onChange = onChange;
    typeAnswer(element, 'looks');

    expect(onChange).toHaveBeenCalledWith({ ...MODEL, correctAnswer: 'looks' });
  });

  it('gives each instance its own answer input id', async () => {
    const first = await mount();
    const firstRoot = root;
    root = null;
    const second = await mount();
    const ids = [first.element, second.element].map(
      (el) => (el.querySelector('input[type="text"]') as HTMLInputElement).id
    );
    expect(ids[0]).not.toBe(ids[1]);
    firstRoot?.remove();
  });
});
