import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('mathlive', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  MathfieldElement: (await import('./fake-mathlive')).FakeMathfieldElement,
}));

// Load MathLive before the first field mounts, as on a page that already shows math.
beforeAll(async () => {
  const { loadMathLive } = await import('@pie-lib/math-input-mathlive');
  await loadMathLive();
});

const { default: MathInline } = await import('../index.js');

type Host = HTMLElement & {
  model: object;
  session: object;
  focusFirstInput: (options?: FocusOptions) => boolean | Promise<boolean>;
};

const TAG = 'test-math-inline-focus-first-input';
customElements.define(TAG, MathInline as unknown as CustomElementConstructor);

const viewModel = (responseType: 'Advanced Multi' | 'Simple', mode: 'gather' | 'evaluate' = 'gather') => ({
  disabled: mode === 'evaluate',
  correctness: mode === 'evaluate' ? { correctness: 'incorrect' } : undefined,
  config: {
    id: '1',
    expression: '{{response}} + 1 = {{response}}',
    responseType,
    responses: [{ id: '1', answer: 'x', alternates: {} }],
    env: { mode, role: 'student' },
  },
});

function mount(model: object): Host {
  const el = document.createElement(TAG) as Host;
  document.body.appendChild(el);
  el.model = model;
  el.session = { answers: { r1: { value: '' }, r2: { value: '' } } };
  return el;
}

function outsideInput(): HTMLInputElement {
  const input = document.createElement('input');
  document.body.appendChild(input);
  return input;
}

const field = (el: Element) => el.querySelector('math-field');

afterEach(() => {
  (document.activeElement as HTMLElement | null)?.blur?.();
  document.body.innerHTML = '';
});

describe('math-inline focusFirstInput', () => {
  it('waits for the answer field to mount, then focuses it with the caret in the first block', async () => {
    const el = mount(viewModel('Advanced Multi'));

    const result = el.focusFirstInput();

    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe(true);
    expect(document.activeElement).toBe(field(el));
    expect((field(el) as HTMLElement & { position: number }).position).toBe(0);
    // Focus is no context change: the keypad opens on a click or ArrowDown.
    expect(el.querySelectorAll('button')).toHaveLength(0);
  });

  it('focuses a mounted field at once', async () => {
    const el = mount(viewModel('Advanced Multi'));
    await el.focusFirstInput();
    outsideInput().focus();

    expect(el.focusFirstInput({ preventScroll: true })).toBe(true);
    expect(document.activeElement).toBe(field(el));
  });

  it('focuses the editor of a simple response', async () => {
    const el = mount(viewModel('Simple'));

    expect(await el.focusFirstInput()).toBe(true);
    expect(document.activeElement).toBe(field(el));
    expect(el.querySelectorAll('button')).toHaveLength(0);
  });

  it('resolves false when the item shows no field to type into', async () => {
    const outside = outsideInput();
    outside.focus();
    const el = mount(viewModel('Advanced Multi', 'evaluate'));

    expect(await el.focusFirstInput()).toBe(false);
    expect(field(el)).toBeNull();
    expect(document.activeElement).toBe(outside);
  });

  it('leaves focus the learner moved while the field mounted', async () => {
    const el = mount(viewModel('Advanced Multi'));
    const result = el.focusFirstInput();
    const elsewhere = outsideInput();
    elsewhere.focus();

    expect(await result).toBe(false);
    expect(document.activeElement).toBe(elsewhere);
  });

  it('resolves false for an element removed while it mounted, or given no model', async () => {
    const removed = mount(viewModel('Advanced Multi'));
    const result = removed.focusFirstInput();
    removed.remove();
    expect(await result).toBe(false);

    const empty = document.createElement(TAG) as Host;
    document.body.appendChild(empty);
    expect(empty.focusFirstInput()).toBe(false);
  });
});
