import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/inline-dropdown.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: RootInlineDropdown } = await import('../src/delivery/index.js');

const TAG = 'pie-inline-dropdown-region-name-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, RootInlineDropdown as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  return element;
}

describe('inline-dropdown region name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is English before a model arrives', () => {
    expect(mount().getAttribute('aria-label')).toBe('Inline Dropdown Question');
  });

  it.each([
    ['en_US', 'Inline Dropdown Question'],
    ['es_ES', 'Pregunta con menú desplegable'],
    [undefined, 'Inline Dropdown Question'],
  ])('follows the %s item language', (language, name) => {
    const element = mount();

    element.model = { markup: '<div></div>', language };
    element.session = {};

    expect(element.getAttribute('aria-label')).toBe(name);
  });

  it('follows a language change after the first render', () => {
    const element = mount();
    element.model = { markup: '<div></div>', language: 'en_US' };
    element.session = {};

    element.model = { markup: '<div></div>', language: 'es_ES' };

    expect(element.getAttribute('aria-label')).toBe('Pregunta con menú desplegable');
  });
});
