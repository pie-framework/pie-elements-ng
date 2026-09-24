import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: ExplicitConstructedResponse } = await import('../src/delivery/index.js');

const TAG = 'pie-explicit-constructed-response-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, ExplicitConstructedResponse as CustomElementConstructor);
}

function mount(model: Record<string, unknown> = {}) {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  const events: CustomEvent[] = [];
  element.addEventListener('session-changed', (event: Event) => {
    events.push(event as CustomEvent);
  });
  element.model = { markup: '<div></div>', language: 'en-US', ...model };
  element.session = {};
  return { element, events };
}

describe('explicit-constructed-response session commit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('writes the value to the session synchronously, before the notification', () => {
    const { element, events } = mount();

    element.changeSession({ 0: 'a' });

    expect(element.session.value).toEqual({ 0: 'a' });
    expect(events).toHaveLength(0);
  });

  it('coalesces a burst of keystrokes into one notification', () => {
    const { element, events } = mount();

    element.changeSession({ 0: 'a' });
    element.changeSession({ 0: 'ab' });
    element.changeSession({ 0: 'abc' });
    vi.advanceTimersByTime(200);

    expect(events).toHaveLength(1);
    expect(element.session.value).toEqual({ 0: 'abc' });
  });

  it('commits the pending value on teardown', () => {
    const { element, events } = mount();

    element.changeSession({ 0: 'abc' });
    element.remove();

    expect(events).toHaveLength(1);
    expect(events[0].detail.complete).toBe(true);
  });

  it('notifies on the next tick when every blank is a single character', () => {
    const { element, events } = mount({ maxLengthPerChoice: [1, 1] });

    element.changeSession({ 0: 'a' });
    expect(events).toHaveLength(0);

    vi.advanceTimersByTime(0);
    expect(events).toHaveLength(1);
  });

  it('adds no event on teardown when nothing was entered', () => {
    const { element, events } = mount();

    element.remove();

    expect(events).toHaveLength(0);
  });

  it('commits to a document-level listener while still attached', () => {
    // The path the players use. An element's own `disconnectedCallback` runs
    // after removal, so an event dispatched there never reaches `document`;
    // a player calls this hook while the element is still in the tree.
    const { element } = mount();
    const atDocument: CustomEvent[] = [];
    const listener = (event: Event) => atDocument.push(event as CustomEvent);
    document.addEventListener('session-changed', listener);

    element.changeSession({ 0: 'cat' });
    expect(atDocument).toHaveLength(0);
    element.commitPendingSession();
    document.removeEventListener('session-changed', listener);

    expect(atDocument).toHaveLength(1);
    expect(element.isConnected).toBe(true);
    expect(element.session.value).toEqual({ 0: 'cat' });
  });
});
