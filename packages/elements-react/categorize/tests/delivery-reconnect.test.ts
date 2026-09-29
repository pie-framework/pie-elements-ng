import { afterEach, describe, expect, it, vi } from 'vitest';

const rendered = vi.hoisted(() => ({ sessions: [] as unknown[] }));

vi.mock('../src/delivery/categorize/index.js', async () => {
  const React = await import('react');
  return {
    default: (props: { session: unknown }) => {
      rendered.sessions.push(props.session);
      return React.createElement('div', { 'data-testid': 'categorize' });
    },
  };
});
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/render-ui', () => ({
  default: { EnableAudioAutoplayImage: () => null },
  EnableAudioAutoplayImage: () => null,
}));

const { default: Categorize } = await import('../src/delivery/index.js');

const TAG = 'pie-categorize-reconnect-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, Categorize as CustomElementConstructor);
}

const rendersContent = (element: Element) =>
  vi.waitFor(() => expect(element.querySelector('[data-testid="categorize"]')).not.toBeNull());

async function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = { choices: [{ id: '1', content: 'one' }], categories: [] };
  element.session = { answers: [] };
  await rendersContent(element);
  return element;
}

describe('categorize delivery reconnect', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    rendered.sessions.length = 0;
  });

  it('takes a session written after removal and renders it when reinserted', async () => {
    const element = await mount();
    element.remove();

    const latest = { answers: [{ category: 'a', choices: ['1'] }] };
    expect(() => {
      element.session = latest;
    }).not.toThrow();
    document.body.appendChild(element);

    await rendersContent(element);
    await vi.waitFor(() => expect(rendered.sessions.at(-1)).toBe(latest));
  });

  it('renders again when reinserted', async () => {
    const element = await mount();
    element.remove();
    expect(element.querySelector('[data-testid="categorize"]')).toBeNull();

    document.body.appendChild(element);

    await rendersContent(element);
  });
});
