/**
 * The authoring contract between this element and a player. An authoring
 * player listens for `model.updated` at its root, so each edit must bubble out
 * of the element as that event, carrying the whole model: the fields the form
 * does not edit, `id` and the player's versioned `element` included.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import SimpleClozeAuthor from '../src/author/index.js';
import defaults from '../src/controller/defaults.js';

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

/** The item after an edit: the controller's defaults filled in, the edit applied. */
const edited = (patch: Record<string, unknown>) => ({ ...defaults.model, ...MODEL, ...patch });

let root: HTMLElement | null = null;

async function mount(configuration?: Record<string, unknown>) {
  root = document.createElement('div');
  document.body.appendChild(root);
  const updates: CustomEvent[] = [];
  const modelsAtDispatch: unknown[] = [];
  const element = document.createElement(TAG) as any;
  // Capture phase on an ancestor, as an authoring player registers it.
  root.addEventListener(
    'model.updated',
    (e) => {
      updates.push(e as CustomEvent);
      modelsAtDispatch.push(element.model);
    },
    true
  );
  root.appendChild(element);
  element.model = { ...MODEL };
  if (configuration) element.configuration = configuration;
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return { element, updates, modelsAtDispatch };
}

function typeAnswer(element: HTMLElement, value: string) {
  const input = element.querySelector('input[type="text"]') as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  flushSync();
}

const switches = (element: HTMLElement) =>
  [...element.querySelectorAll('aside input[role="switch"]')] as HTMLInputElement[];

const switchLabels = (element: HTMLElement) =>
  switches(element).map((input) => input.closest('label')?.textContent?.trim());

const switchFor = (element: HTMLElement, label: string) =>
  switches(element).find(
    (input) => input.closest('label')?.textContent?.trim() === label
  ) as HTMLInputElement;

const fieldLabels = (element: HTMLElement) =>
  [...element.querySelectorAll('.input-label')].map((el) => el.textContent?.trim());

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
      update: edited({ correctAnswer: 'looks' }),
      reset: false,
    });
    expect(element.model).toEqual(edited({ correctAnswer: 'looks' }));
  });

  it('builds each edit on the previous one', async () => {
    const { element, updates } = await mount();
    typeAnswer(element, 'looks');
    typeAnswer(element, 'looked');

    expect(updates.at(-1)?.detail.update).toEqual(edited({ correctAnswer: 'looked' }));
  });

  it('holds the edited model by the time the player hears the edit', async () => {
    const { element, modelsAtDispatch } = await mount();
    typeAnswer(element, 'looks');

    expect(modelsAtDispatch).toEqual([edited({ correctAnswer: 'looks' })]);
  });

  it('names its settings and fields after the configuration', async () => {
    const { element } = await mount({
      prompt: { label: 'Question' },
      teacherInstructions: { label: 'Notes for teachers' },
    });

    expect(switchLabels(element)).toEqual(['Question', 'Notes for teachers']);
    expect(fieldLabels(element)).toEqual(['Notes for teachers', 'Question']);
  });

  it('announces a setting turned off and hides its field', async () => {
    const { element, updates } = await mount();
    switchFor(element, 'Prompt').click();
    flushSync();

    expect(updates.at(-1)?.detail.update).toEqual(edited({ promptEnabled: false }));
    expect(fieldLabels(element)).toEqual(['Teacher Instructions']);
  });

  it('leaves out settings the configuration does not offer', async () => {
    const { element } = await mount({ prompt: { settings: false } });

    expect(switchLabels(element)).toEqual(['Teacher Instructions']);
  });

  it('hides the settings panel when the configuration disables it', async () => {
    const { element } = await mount({ settingsPanelDisabled: true });

    expect(element.querySelector('aside')).toBeNull();
    expect(fieldLabels(element)).toEqual(['Teacher Instructions', 'Prompt']);
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
