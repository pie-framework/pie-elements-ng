import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: MathInline } = await import('../src/delivery/index.js');

const TAG = 'pie-math-inline-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MathInline as CustomElementConstructor);
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

describe('math-inline session commit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('keeps the session readable while the notification is still pending', () => {
    const { element, events } = mount();

    element.sessionChanged({ response: '2x+1' });

    expect(element.session.response).toBe('2x+1');
    expect(events).toHaveLength(0);
  });

  it('commits the pending notification on teardown', () => {
    const { element, events } = mount();

    element.sessionChanged({ response: '2x+1' });
    element.remove();

    expect(events).toHaveLength(1);
  });

  it('does not dispatch twice when the debounce already elapsed', () => {
    const { element, events } = mount();

    element.sessionChanged({ response: '2x+1' });
    vi.advanceTimersByTime(1000);
    element.remove();

    expect(events).toHaveLength(1);
  });

  it('commits to a document-level listener while still attached', () => {
    // The path the players use. An element's own `disconnectedCallback` runs
    // after removal, so an event dispatched there never reaches `document`;
    // a player calls this hook while the element is still in the tree.
    const { element } = mount();
    const atDocument: CustomEvent[] = [];
    const listener = (event: Event) => atDocument.push(event as CustomEvent);
    document.addEventListener('session-changed', listener);

    element.sessionChanged({ response: '2x+1' });
    expect(atDocument).toHaveLength(0);
    element.commitPendingSession();
    document.removeEventListener('session-changed', listener);

    expect(atDocument).toHaveLength(1);
    expect(element.isConnected).toBe(true);
    expect(element.session.response).toBe('2x+1');
  });
});
