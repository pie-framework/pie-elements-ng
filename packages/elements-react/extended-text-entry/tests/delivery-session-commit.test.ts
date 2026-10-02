import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: RootExtendedTextEntry } = await import('../src/delivery/index.js');

const TAG = 'pie-extended-text-entry-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, RootExtendedTextEntry as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  const events: CustomEvent[] = [];
  element.addEventListener('session-changed', (event: Event) => {
    events.push(event as CustomEvent);
  });
  element.model = { prompt: 'p', language: 'en-US' };
  element.session = {};
  return { element, events };
}

describe('extended-text-entry session commit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('writes the value to the session synchronously, before the notification', () => {
    const { element, events } = mount();

    element.valueChange('<div>an answer</div>');

    expect(element.session.value).toBe('<div>an answer</div>');
    expect(events).toHaveLength(0);
  });

  it('commits the pending value on teardown', () => {
    const { element, events } = mount();

    element.valueChange('<div>an answer</div>');
    element.remove();

    expect(events).toHaveLength(1);
    expect(events[0].detail.complete).toBe(true);
    expect(element.session.value).toBe('<div>an answer</div>');
  });

  it('does not dispatch twice when the debounce already elapsed', () => {
    const { element, events } = mount();

    element.valueChange('<div>an answer</div>');
    vi.advanceTimersByTime(1500);
    expect(events).toHaveLength(1);

    element.remove();
    expect(events).toHaveLength(1);
  });

  it('adds no event on teardown when nothing was entered', () => {
    const { element, events } = mount();

    element.remove();

    expect(events).toHaveLength(0);
  });

  it('commits a pending comment on teardown', () => {
    const { element, events } = mount();

    element.commentChange('<div>a comment</div>');
    expect(element.session.comment).toBe('<div>a comment</div>');
    expect(events).toHaveLength(0);

    element.remove();
    expect(events).toHaveLength(1);
  });

  it('exposes a commit hook a player can call while the element is attached', () => {
    const { element, events } = mount();

    element.valueChange('<div>an answer</div>');
    expect(typeof element.commitPendingSession).toBe('function');

    element.commitPendingSession();

    expect(events).toHaveLength(1);
    expect(element.isConnected).toBe(true);
  });
});
