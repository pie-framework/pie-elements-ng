import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: MathTemplated } = await import('../src/delivery/index.js');

const TAG = 'pie-math-templated-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MathTemplated as CustomElementConstructor);
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

describe('math-templated session commit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('keeps the session readable while the notification is still pending', () => {
    const { element, events } = mount();

    element.onSessionChange({ answers: { r1: { value: '3' } } });

    expect(element.session.answers.r1.value).toBe('3');
    expect(events).toHaveLength(0);
  });

  it('commits the pending notification on teardown', () => {
    const { element, events } = mount();

    element.onSessionChange({ answers: { r1: { value: '3' } } });
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

    element.onSessionChange({ answers: { r1: { value: '3' } } });
    expect(atDocument).toHaveLength(0);
    element.commitPendingSession();
    document.removeEventListener('session-changed', listener);

    expect(atDocument).toHaveLength(1);
    expect(element.isConnected).toBe(true);
    expect(element.session.answers.r1.value).toBe('3');
  });
});
