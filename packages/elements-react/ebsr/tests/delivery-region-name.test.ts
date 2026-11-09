import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/multiple-choice', () => ({
  default: class extends HTMLElement {
    received: Record<string, unknown> | undefined;
    set model(model: Record<string, unknown>) {
      this.received = model;
    }
    set session(_session: unknown) {}
  },
}));

const { default: Ebsr } = await import('../src/delivery/index.js');
const { model } = await import('../src/controller/index.js');

const TAG = 'pie-ebsr-region-name-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Ebsr as CustomElementConstructor);
}

const part = { choiceMode: 'radio', choices: [{ value: 'a', label: 'A', correct: true }] };

function mount(viewModel: Record<string, unknown>) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = viewModel;
  return element;
}

const heading = (element: HTMLElement) => element.querySelector('.srOnly')?.textContent;
const received = (element: HTMLElement, key: 'a' | 'b') =>
  (element.querySelector(`[data-part="${key}"]`) as any)?.received;

describe('ebsr region name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    ['en_US', 'Two-Part Question'],
    ['es_ES', 'Pregunta de dos partes'],
    [undefined, 'Two-Part Question'],
  ])('names the region and its heading in the %s item language', async (language, name) => {
    const element = mount({ mode: 'gather', language, partA: part, partB: part });

    await vi.waitFor(() => expect(element.getAttribute('aria-label')).toBe(name));
    expect(heading(element)).toBe(name);
  });

  it('follows a language change after the first render, keeping the parts mounted', async () => {
    const element = mount({ mode: 'gather', partA: part, partB: part });
    await vi.waitFor(() => expect(heading(element)).toBe('Two-Part Question'));
    const partA = element.querySelector('[data-part="a"]');

    element.model = { mode: 'gather', language: 'es_ES', partA: part, partB: part };

    await vi.waitFor(() => expect(element.getAttribute('aria-label')).toBe('Pregunta de dos partes'));
    expect(heading(element)).toBe('Pregunta de dos partes');
    expect(element.querySelector('[data-part="a"]')).toBe(partA);
  });

  it('labels the parts from the controller output', async () => {
    const viewModel = await model(
      { language: 'es_ES', partLabels: true, partA: part, partB: part },
      {},
      { mode: 'gather', role: 'student' },
    );
    const element = mount(viewModel);

    await vi.waitFor(() => expect(element.getAttribute('aria-label')).toBe('Pregunta de dos partes'));
    await vi.waitFor(() => expect(received(element, 'a')?.partLabel).toBe('Parte A'));
    expect(received(element, 'b')?.partLabel).toBe('Parte B');
  });

  it("gives a part that declares no language part A's", async () => {
    const viewModel = await model(
      { partA: { ...part, language: 'es_ES' }, partB: part },
      {},
      { mode: 'gather', role: 'student' },
    );

    expect(viewModel.partB.language).toBe('es_ES');

    const element = mount({ mode: 'gather', partA: { ...part, language: 'es_ES' }, partB: part });
    await vi.waitFor(() => expect(received(element, 'b')?.language).toBe('es_ES'));
    expect(element.getAttribute('aria-label')).toBe('Pregunta de dos partes');
  });
});
