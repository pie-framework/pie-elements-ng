import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: SelectText } = await import('../index.js');

const TAG = 'pie-select-text-answer-masking-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, SelectText as CustomElementConstructor);
}

const TEXT = 'The storm hit. Mara ran. Rain fell.';
const TOKENS = [
  { text: 'The storm hit.', start: 0, end: 14 },
  { text: 'Mara ran.', start: 15, end: 24 },
  { text: 'Rain fell.', start: 25, end: 35 },
];

async function mount(model: Record<string, unknown> = {}, selectedTokens: unknown[] = []) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = { prompt: 'p', text: TEXT, tokens: TOKENS, disabled: false, env: { mode: 'gather' }, ...model };
  element.session = { selectedTokens };
  await vi.waitFor(() => expect(element.querySelectorAll('[data-token-start]').length).toBeGreaterThan(0));
  return element;
}

interface Target {
  id: string;
  label: string;
  container: HTMLElement;
  content: Element;
  isSelected(): boolean;
  isEliminable(): boolean;
  setEliminated(eliminated: boolean): void;
}

const targets = (element: any): Target[] => element.pieSupportTargets('answer-masking');

const target = (element: any, id: string) => targets(element).find((token) => token.id === id) as Target;

const tokenSpan = (element: HTMLElement, start: number) =>
  element.querySelector(`[data-token-start="${start}"] [data-indexkey]`) as HTMLElement;

describe('select-text answer masking', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('declares answer masking on its class', () => {
    expect(SelectText.pieSupports).toEqual(['answer-masking']);
  });

  it('supplies each token by offsets, its button inside a container that is not one', async () => {
    const element = await mount();

    const supplied = targets(element);

    expect(supplied.map(({ id, label }) => [id, label])).toEqual([
      ['0-14', 'The storm hit.'],
      ['15-24', 'Mara ran.'],
      ['25-35', 'Rain fell.'],
    ]);
    for (const { container, content } of supplied) {
      expect(container.contains(content)).toBe(true);
      expect(container.closest('[role="button"]')).toBeNull();
    }
    expect(element.pieSupportTargets('text-to-speech')).toEqual([]);
  });

  it('blocks selecting an eliminated token until it is restored', async () => {
    const element = await mount();

    target(element, '15-24').setEliminated(true);
    await vi.waitFor(() => expect(tokenSpan(element, 15)).toHaveAttribute('aria-disabled', 'true'));
    tokenSpan(element, 15).click();
    tokenSpan(element, 25).click();
    await vi.waitFor(() => expect(element.session.selectedTokens).toHaveLength(1));
    expect(element.session.selectedTokens).toMatchObject([{ start: 25, end: 35 }]);

    target(element, '15-24').setEliminated(false);
    await vi.waitFor(() => expect(tokenSpan(element, 15)).not.toHaveAttribute('aria-disabled'));
    tokenSpan(element, 15).click();
    await vi.waitFor(() => expect(element.session.selectedTokens).toHaveLength(2));
  });

  it('reports a selected token, which cannot be eliminated', async () => {
    const element = await mount();

    tokenSpan(element, 0).click();
    await vi.waitFor(() => expect(target(element, '0-14').isSelected()).toBe(true));

    expect(target(element, '0-14').isEliminable()).toBe(false);
    expect(target(element, '15-24').isEliminable()).toBe(true);
  });

  it('offers no token for elimination outside gather', async () => {
    const element = await mount({ disabled: true, env: { mode: 'view' } }, [{ start: 0, end: 14 }]);

    expect(targets(element).map(({ id }) => id)).toEqual(['0-14']);
    expect(targets(element).map((token) => token.isEliminable())).toEqual([false]);
  });
});
