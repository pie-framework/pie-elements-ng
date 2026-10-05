import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: RootExtendedTextEntry } = await import('../src/delivery/index.js');

const TAG = 'pie-extended-text-entry-region-name-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, RootExtendedTextEntry as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  return element;
}

describe('extended-text-entry region name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is English before a model arrives', () => {
    expect(mount().getAttribute('aria-label')).toBe('Written Response Question');
  });

  it.each([
    ['en_US', 'Written Response Question'],
    ['es_ES', 'Pregunta de respuesta escrita'],
    [undefined, 'Written Response Question'],
  ])('follows the %s item language', (language, name) => {
    const element = mount();

    element.model = { prompt: 'p', language };
    element.session = {};

    expect(element.getAttribute('aria-label')).toBe(name);
  });

  it('follows a language change after the first render', () => {
    const element = mount();
    element.model = { prompt: 'p', language: 'en_US' };
    element.session = {};

    element.model = { prompt: 'p', language: 'es_ES' };

    expect(element.getAttribute('aria-label')).toBe('Pregunta de respuesta escrita');
  });
});
