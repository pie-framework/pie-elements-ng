import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', async () => {
  const React = await import('react');
  return { default: () => React.createElement('div', { 'data-testid': 'rubric' }) };
});
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: RubricRender } = await import('../src/delivery/index.js');

const TAG = 'pie-rubric-reconnect-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, RubricRender as CustomElementConstructor);
}

const rendersContent = (element: Element) =>
  vi.waitFor(() => expect(element.querySelector('[data-testid="rubric"]')).not.toBeNull());

describe('rubric delivery reconnect', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders again when removed and reinserted', async () => {
    const element = document.createElement(TAG) as any;
    document.body.appendChild(element);
    element.model = { points: ['none', 'all'], maxPoints: 1 };
    await rendersContent(element);

    element.remove();
    expect(element.querySelector('[data-testid="rubric"]')).toBeNull();
    expect(() => document.body.appendChild(element)).not.toThrow();

    await rendersContent(element);
  });
});
