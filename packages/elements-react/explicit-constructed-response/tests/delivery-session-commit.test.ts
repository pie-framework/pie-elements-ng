import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
// A root's unmount runs onUnmount, standing in for an editor that saves as it unmounts.
const roots = vi.hoisted(() => ({ created: 0, rendered: 0, last: null as any, onUnmount: null as null | (() => void) }));
// Stands in for a response editor holding an idle save that flushPendingEditorSaves sends.
const editors = vi.hoisted(() => ({ onFlush: null as null | (() => void), flushed: 0 }));
vi.mock('@pie-lib/editable-html-tip-tap', () => ({
  flushPendingEditorSaves: () => {
    editors.flushed += 1;
    editors.onFlush?.();
  },
}));
vi.mock('react-dom/client', () => ({
  createRoot: () => {
    roots.created += 1;
    return {
      render: (element: unknown) => {
        roots.rendered += 1;
        roots.last = element;
      },
      unmount: () => roots.onUnmount?.(),
    };
  },
}));

const { default: ExplicitConstructedResponse } = await import('../src/delivery/index.js');

const TAG = 'pie-explicit-constructed-response-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, ExplicitConstructedResponse as CustomElementConstructor);
}

function mount(model: Record<string, unknown> = {}, parent: Element = document.body) {
  const element = document.createElement(TAG) as any;
  parent.appendChild(element);
  const events: CustomEvent[] = [];
  element.addEventListener('session-changed', (event: Event) => {
    events.push(event as CustomEvent);
  });
  element.model = { markup: '<div></div>', language: 'en-US', ...model };
  element.session = {};
  return { element, events };
}

// Stands in for a player answering `sessionCommitContext` (pie-players ADR 0005).
function inPlayer(value: { idleSaveDelayMs?: number }) {
  const player = document.createElement('div');
  const subscribers = new Map<(value: unknown, unsubscribe: () => void) => void, () => void>();
  player.addEventListener('context-request', (event: any) => {
    if (event.context !== Symbol.for('pie.sessionCommit')) {
      return;
    }
    event.stopPropagation();
    const unsubscribe = () => subscribers.delete(event.callback);
    if (event.subscribe) {
      subscribers.set(event.callback, unsubscribe);
    }
    event.callback(value, unsubscribe);
  });
  document.body.appendChild(player);
  return {
    player,
    subscribers,
    setValue(next: { idleSaveDelayMs?: number }) {
      value = next;
      for (const [callback, unsubscribe] of subscribers) {
        callback(value, unsubscribe);
      }
    },
  };
}

describe('explicit-constructed-response session commit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
    roots.onUnmount = null;
    editors.onFlush = null;
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

  it('commits a value the editor writes as it unmounts, without rendering again', () => {
    const { element, events } = mount();
    roots.onUnmount = () => element.changeSession({ 0: 'typed last' });
    const { created, rendered } = roots;

    element.remove();

    expect(events).toHaveLength(1);
    expect(element.session.value).toEqual({ 0: 'typed last' });
    expect(roots.created).toBe(created);
    expect(roots.rendered).toBe(rendered);

    vi.advanceTimersByTime(2000);
    expect(events).toHaveLength(1);
  });

  it('passes the default idle-save delay when no player provides one', () => {
    mount();

    expect(roots.last.props.idleSaveDelay).toBe(1500);
  });

  it("passes the player's idle-save delay, and follows a change", () => {
    const player = inPlayer({ idleSaveDelayMs: 1000 });
    const { element } = mount({}, player.player);

    expect(roots.last.props.idleSaveDelay).toBe(1000);

    player.setValue({ idleSaveDelayMs: 0 });
    expect(roots.last.props.idleSaveDelay).toBe(0);

    element.remove();
    expect(player.subscribers.size).toBe(0);
  });

  it("keeps another blank's commit when a blank changes on a value from an older render", () => {
    const { element } = mount();

    element.changeSession({ 0: 'a' }, '0');
    // Blank 1 still holds the value from before blank 0's commit was rendered.
    element.changeSession({ 0: '', 1: 'b' }, '1');

    expect(element.session.value).toEqual({ 0: 'a', 1: 'b' });
  });

  it("sends a response editor's pending idle save when a player commits", () => {
    const { element, events } = mount();
    editors.onFlush = () => element.changeSession({ 0: 'typed last' }, '0');

    element.commitPendingSession();

    expect(editors.flushed).toBeGreaterThan(0);
    expect(element.session.value).toEqual({ 0: 'typed last' });
    expect(events).toHaveLength(1);
    expect(element.isConnected).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(events).toHaveLength(1);
  });
});
