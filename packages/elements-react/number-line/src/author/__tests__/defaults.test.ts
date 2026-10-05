import { describe, expect, it, vi } from 'vitest';

const rendered: any[] = [];

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: (el: unknown) => rendered.push(el), unmount: () => {} }),
}));

const { default: Author } = await import('../index');
const { model: defaultModel } = await import('../defaults');

const DEFAULT_GRAPH = structuredClone(defaultModel.graph);

const TAG = 'pie-number-line-author-defaults-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Author as CustomElementConstructor);
}

const author = (model: object, configuration?: object) => {
  const element = document.createElement(TAG) as any;
  element.model = model;
  if (configuration) {
    element.configuration = configuration;
  }
  return element;
};

/** The props of the view the author element rendered last. */
const lastProps = () => rendered.at(-1).props;

describe('number-line author defaults', () => {
  it('starts the next new item on the default graph after a domain edit', () => {
    author({});
    // React constructs the view on mount; the domain inputs then call graphChange.
    const { type: Main, props } = rendered.at(-1);
    new Main(props).graphChange({ domain: { min: 0, max: 100 } });

    author({});

    expect(lastProps().model.graph).toEqual(DEFAULT_GRAPH);
  });

  it('leaves the next item without a language after one in es_ES', () => {
    author({ language: 'es_ES' }, { language: { settings: true, enabled: false } });
    author({}, { language: { settings: true, enabled: true } });

    expect(lastProps().model.language).toBe('');
  });
});
