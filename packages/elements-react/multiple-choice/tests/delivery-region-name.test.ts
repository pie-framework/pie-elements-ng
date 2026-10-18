import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/render-ui', () => ({
  default: { EnableAudioAutoplayImage: () => null },
  EnableAudioAutoplayImage: () => null,
}));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: MultipleChoice } = await import('../src/delivery/index.js');

const TAG = 'pie-multiple-choice-region-name-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MultipleChoice as CustomElementConstructor);
}

const choices = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
];

function mount(model: Record<string, unknown>) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = { prompt: 'p', choices, ...model };
  element.session = {};
  // The element renders on a 50ms debounce.
  vi.advanceTimersByTime(50);
  return element;
}

describe('multiple-choice region name', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it.each([
    ['radio', 'en_US', 'Multiple Choice Question'],
    ['checkbox', 'en_US', 'Multiple Correct Answer Question'],
    ['radio', 'es_ES', 'Pregunta de opción múltiple'],
    ['checkbox', 'es_ES', 'Pregunta con varias respuestas correctas'],
    ['radio', undefined, 'Multiple Choice Question'],
  ])('names a %s item in the %s item language', async (choiceMode, language, name) => {
    const element = mount({ choiceMode, language });

    // A language not yet resident loads before the element renders.
    await vi.waitFor(() => expect(element.getAttribute('aria-label')).toBe(name));
  });

  it('follows a language change after the first render', async () => {
    const element = mount({ choiceMode: 'radio', language: 'en_US' });

    element.model = { prompt: 'p', choices, choiceMode: 'radio', language: 'es_ES' };
    vi.advanceTimersByTime(50);

    await vi.waitFor(() => expect(element.getAttribute('aria-label')).toBe('Pregunta de opción múltiple'));
  });

  it.each([
    ['es_MX', 'es-MX', 'ltr'],
    ['ar', 'ar', 'rtl'],
    [undefined, null, null],
    ['Spanish', null, null],
  ])('stamps %j on its own host as lang %s, dir %s', async (language, lang, dir) => {
    document.documentElement.setAttribute('lang', 'nl');
    const element = mount({ choiceMode: 'radio', language });

    await vi.waitFor(() => expect(element.hasAttribute('aria-label')).toBe(true));
    expect(element.getAttribute('lang')).toBe(lang);
    expect(element.getAttribute('dir')).toBe(dir);
    expect(document.documentElement.getAttribute('lang')).toBe('nl');
  });
});
