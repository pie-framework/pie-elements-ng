/**
 * The authoring contract between this element and a player. An authoring
 * player listens for `model.updated` at its root, so each edit must bubble out
 * of the element as that event, carrying the whole model: fields the form does
 * not edit, `id` and the player's versioned `element` included.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import VennClassificationAuthor from '../src/author/index.js';

// The author's live preview typesets math, and the test DOM cannot load MathJax.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: vi.fn() }));

const TAG = 'venn-classification-config--version-0-0-0-author-contract-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, VennClassificationAuthor as CustomElementConstructor);
}

const MODEL = {
  id: '7',
  element: 'venn-classification--version-0-0-0',
  prompt: '<p>Sort</p>',
  promptEnabled: true,
  circles: [{ label: 'Mammals' }, { label: 'Swimmers' }],
  tiles: [
    { id: 't1', label: 'Whale', correctRegion: [0, 1] },
    { id: 't2', label: 'Dog', correctRegion: [0] },
  ],
  regionLabels: {},
  scoringPolicy: 'partialPerTile',
  rubricNotes: 'Kept',
};

let root: HTMLElement | null = null;

async function mount(model: Record<string, unknown> = MODEL) {
  root = document.createElement('div');
  document.body.appendChild(root);
  const updates: CustomEvent[] = [];
  root.addEventListener('model.updated', (e) => updates.push(e as CustomEvent), true);
  const element = document.createElement(TAG) as any;
  root.appendChild(element);
  element.model = structuredClone(model);
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return { element, updates };
}

function tileInputs(element: HTMLElement, row: number) {
  return element.querySelectorAll('.tile-row')[row].querySelectorAll('input[type="text"]');
}

function type(input: Element, value: string) {
  (input as HTMLInputElement).value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

afterEach(() => {
  root?.remove();
  root = null;
});

describe('venn-classification author model contract', () => {
  it('announces an edit at the player root with the whole model', async () => {
    const { element, updates } = await mount();
    type(tileInputs(element, 1)[1], 'Wolf');

    expect(updates).toHaveLength(1);
    const update = updates[0].detail.update;
    expect(update.tiles[1]).toEqual({ id: 't2', label: 'Wolf', correctRegion: [0] });
    expect(update).toMatchObject({
      id: '7',
      element: 'venn-classification--version-0-0-0',
      rubricNotes: 'Kept',
    });
    expect(element.model).toEqual(update);
  });

  it('adds no id or element the item did not have', async () => {
    const { id: _id, element: _element, ...withoutIdentity } = MODEL;
    const { element, updates } = await mount(withoutIdentity);
    type(tileInputs(element, 0)[1], 'Orca');

    expect(updates[0].detail.update).not.toHaveProperty('id');
    expect(updates[0].detail.update).not.toHaveProperty('element');
  });

  it('keeps the row, and its input, while the tile id is typed', async () => {
    const { element } = await mount();
    const idInput = tileInputs(element, 0)[0];
    type(idInput, 't1-renamed');

    expect(tileInputs(element, 0)[0]).toBe(idInput);
  });

  it('survives two tiles sharing an id while one is being renamed', async () => {
    const { element, updates } = await mount();
    type(tileInputs(element, 1)[0], 't1');

    expect(updates.at(-1)?.detail.update.tiles.map((t: any) => t.id)).toEqual(['t1', 't1']);
    expect(element.querySelectorAll('.tile-row')).toHaveLength(2);
  });

  it('calls an onChange callback without recursing into its own setter', async () => {
    const { element } = await mount();
    const onChange = vi.fn();
    element.onChange = onChange;
    type(tileInputs(element, 0)[1], 'Orca');

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
