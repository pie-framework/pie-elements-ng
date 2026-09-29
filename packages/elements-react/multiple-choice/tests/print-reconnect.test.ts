import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const roots = vi.hoisted(() => ({ created: 0, renders: 0 }));

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => {
    roots.created += 1;
    return {
      render: () => {
        roots.renders += 1;
      },
      unmount: () => {},
    };
  },
}));

const { default: MultipleChoicePrint } = await import('../src/print/index.js');

const TAG = 'pie-multiple-choice-print-reconnect-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MultipleChoicePrint as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.options = { role: 'student' };
  element.model = { choiceMode: 'radio', choices: [{ value: 'a', label: 'A' }] };
  return element;
}

describe('multiple-choice print reconnect', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    roots.created = 0;
    roots.renders = 0;
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('drops a render still pending at removal', () => {
    const element = mount();

    element.remove();
    vi.advanceTimersByTime(100);

    expect(roots.created).toBe(0);
  });

  it('renders into a new root when reinserted', () => {
    const element = mount();
    vi.advanceTimersByTime(100);
    expect(roots.created).toBe(1);

    element.remove();
    document.body.appendChild(element);
    vi.advanceTimersByTime(100);

    expect(roots.created).toBe(2);
    expect(roots.renders).toBe(2);
  });
});
