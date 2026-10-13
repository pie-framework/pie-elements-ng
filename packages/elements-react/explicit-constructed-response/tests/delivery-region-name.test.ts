import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: ExplicitConstructedResponse } = await import('../src/delivery/index.js');

const TAG = 'pie-explicit-constructed-response-region-name-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, ExplicitConstructedResponse as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  return element;
}

describe('explicit-constructed-response region name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is English before a model arrives', () => {
    expect(mount().getAttribute('aria-label')).toBe('Fill in the Blank Question');
  });

  it.each([
    ['en_US', 'Fill in the Blank Question'],
    ['es_ES', 'Pregunta para completar espacios en blanco'],
    [undefined, 'Fill in the Blank Question'],
  ])('follows the %s item language', (language, name) => {
    const element = mount();

    element.model = { markup: '<div></div>', language };

    expect(element.getAttribute('aria-label')).toBe(name);
  });

  it('follows a language change after the first render', () => {
    const element = mount();
    element.model = { markup: '<div></div>', language: 'en_US' };
    element.session = {};

    element.model = { markup: '<div></div>', language: 'es_ES' };

    expect(element.getAttribute('aria-label')).toBe('Pregunta para completar espacios en blanco');
  });
});
