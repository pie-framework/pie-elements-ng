import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: MathInline } = await import('../src/delivery/index.js');

const TAG = 'pie-math-inline-region-name-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MathInline as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  return element;
}

describe('math-inline region name', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is English before a model arrives', () => {
    expect(mount().getAttribute('aria-label')).toBe('Math Response Question');
  });

  it.each([
    ['en_US', 'Math Response Question'],
    ['es_ES', 'Pregunta de respuesta matemática'],
    [undefined, 'Math Response Question'],
  ])('follows the %s item language', (language, name) => {
    const element = mount();

    element.model = { language };

    expect(element.getAttribute('aria-label')).toBe(name);
  });

  it('follows a language change after the first render', () => {
    const element = mount();
    element.model = { language: 'en_US' };
    element.session = {};

    element.model = { language: 'es_ES' };

    expect(element.getAttribute('aria-label')).toBe('Pregunta de respuesta matemática');
  });
});
