import { describe, expect, it, vi } from 'vitest';

const rendered: any[] = [];

vi.mock('../src/author/configure.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: (el: unknown) => rendered.push(el), unmount: () => {} }),
}));

const { default: Author } = await import('../src/author/index.js');
const { default: defaultValues } = await import('../src/author/defaults.js');

const TAG = 'pie-graphing-solution-set-configuration-test-config';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Author as CustomElementConstructor);
}

describe('graphing-solution-set author configuration', () => {
  it('merges a configuration without language over the defaults', () => {
    const element = document.createElement(TAG) as any;
    element.model = {};

    expect(() => {
      element.configuration = {};
    }).not.toThrow();
    expect(rendered.at(-1).props.configuration.language).toEqual(defaultValues.configuration.language);
  });
});
