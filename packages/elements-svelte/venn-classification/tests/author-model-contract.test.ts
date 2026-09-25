/**
 * This element's side of the authoring contract. `assertAuthorModelUpdate`
 * checks what every author element owes a host; the rest covers what this
 * element's edits and configuration produce.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { assertAuthorModelUpdate } from '@pie-element/shared-test-utils';
import VennClassificationAuthor from '../src/author/index.js';
import defaults from '../src/controller/defaults.js';

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

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

async function mount(
  model: Record<string, unknown> = MODEL,
  configuration?: Record<string, unknown>
) {
  root = document.createElement('div');
  document.body.appendChild(root);
  const updates: CustomEvent[] = [];
  const element = document.createElement(TAG) as any;
  root.addEventListener('model.updated', (e) => updates.push(e as CustomEvent), true);
  root.appendChild(element);
  element.model = structuredClone(model);
  if (configuration) element.configuration = configuration;
  await settle();
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

const settingLabels = (element: HTMLElement) =>
  [
    ...element.querySelectorAll('aside input[role="switch"], aside .pie-settings-choice > legend'),
  ].map((el) => (el.closest('label') ?? el).textContent?.trim());

afterEach(() => {
  root?.remove();
  root = null;
});

describe('venn-classification author model contract', () => {
  it('meets the authoring contract, announcing the whole model', async () => {
    const { event, cleanup } = await assertAuthorModelUpdate({
      tag: TAG,
      model: MODEL,
      settle,
      edit: (element) => type(tileInputs(element, 1)[1], 'Wolf'),
    });
    const update = event.detail.update as any;

    expect(update.tiles[1]).toEqual({ id: 't2', label: 'Wolf', correctRegion: [0] });
    expect(update.rubricNotes).toBe('Kept');
    cleanup();
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

  it("names each tile's correct region in the preview list as delivery does, overrides included", async () => {
    const { element } = await mount({ ...MODEL, regionLabels: { '0,1': 'Both' } });
    const regions = [...element.querySelectorAll('.preview-list .preview-region')].map(
      (el: Element) => el.textContent
    );

    expect(regions).toEqual(['Both', 'Mammals only']);
  });

  it('builds each edit on the previous one', async () => {
    const { element, updates } = await mount();
    type(tileInputs(element, 0)[1], 'Orca');
    type(tileInputs(element, 1)[1], 'Wolf');

    expect(updates.at(-1)?.detail.update.tiles.map((t: any) => t.label)).toEqual(['Orca', 'Wolf']);
  });

  it("fills fields the item lacks from the controller's defaults", async () => {
    const { element, updates } = await mount({ tiles: MODEL.tiles, rubricNotes: 'Kept' });
    type(tileInputs(element, 0)[1], 'Orca');

    expect(updates[0].detail.update).toEqual({
      ...defaults.model,
      tiles: [{ ...MODEL.tiles[0], label: 'Orca' }, MODEL.tiles[1]],
      rubricNotes: 'Kept',
    });
  });

  it('names its settings and fields after the configuration', async () => {
    const { element } = await mount(MODEL, {
      prompt: { label: 'Question' },
      scoringPolicy: { label: 'Scoring' },
    });

    expect(settingLabels(element)).toEqual(['Question', 'Teacher Instructions', 'Scoring']);
    expect(
      [...element.querySelectorAll('.editor-column > .field-group > .field-header')]
        .slice(0, 2)
        .map((el) => el.textContent?.trim())
    ).toEqual(['Teacher Instructions', 'Question']);
    expect(
      [...element.querySelectorAll('.editor-column [contenteditable]')]
        .slice(0, 2)
        .map((el) => el.getAttribute('aria-label'))
    ).toEqual(['Teacher Instructions', 'Question']);
  });

  it('sets the scoring policy from the settings panel', async () => {
    const { element, updates } = await mount();
    (element.querySelector('aside input[value="allOrNothing"]') as HTMLInputElement).click();
    flushSync();

    expect(updates.at(-1)?.detail.update).toMatchObject({
      scoringPolicy: 'allOrNothing',
      rubricNotes: 'Kept',
    });
  });

  it('leaves out settings the configuration does not offer', async () => {
    const { element } = await mount(MODEL, { scoringPolicy: { settings: false } });

    expect(settingLabels(element)).toEqual(['Prompt', 'Teacher Instructions']);
  });
});
