import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/multiple-choice', () => ({
  default: class extends HTMLElement {
    set model(_model: unknown) {}
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

describe('ebsr region name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it.each([
    ['en_US', 'Two-Part Question'],
    ['es_ES', 'Pregunta de dos partes'],
    [undefined, 'Two-Part Question'],
  ])('names the region and its heading in the %s item language', (language, name) => {
    const element = mount({ mode: 'gather', language, partA: part, partB: part });

    expect(element.getAttribute('aria-label')).toBe(name);
    expect(heading(element)).toBe(name);
  });

  it('follows a language change after the first render, keeping the parts mounted', () => {
    const element = mount({ mode: 'gather', partA: part, partB: part });
    const partA = element.querySelector('#a');

    element.model = { mode: 'gather', language: 'es_ES', partA: part, partB: part };

    expect(element.getAttribute('aria-label')).toBe('Pregunta de dos partes');
    expect(heading(element)).toBe('Pregunta de dos partes');
    expect(element.querySelector('#a')).toBe(partA);
  });

  it('takes the language from the controller output', async () => {
    const viewModel = await model(
      { language: 'es_ES', partLabels: true, partA: part, partB: part },
      {},
      { mode: 'gather', role: 'student' },
    );
    const element = mount(viewModel);

    expect(element.getAttribute('aria-label')).toBe('Pregunta de dos partes');
    expect(viewModel.partA.partLabel).toBe('Parte A');
    expect(viewModel.partB.partLabel).toBe('Parte B');
  });
});
