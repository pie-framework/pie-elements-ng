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

const { default: RootExtendedTextEntry } = await import('../src/delivery/index.js');

const TAG = 'pie-extended-text-entry-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, RootExtendedTextEntry as CustomElementConstructor);
}

function mount(parent: Element = document.body) {
  const element = document.createElement(TAG) as any;
  parent.appendChild(element);
  const events: CustomEvent[] = [];
  element.addEventListener('session-changed', (event: Event) => {
    events.push(event as CustomEvent);
  });
  element.model = { prompt: 'p', language: 'en-US' };
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

describe('extended-text-entry session commit', () => {
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

  it('commits a value the editor writes as it unmounts, without rendering again', () => {
    const { element, events } = mount();
    roots.onUnmount = () => element.valueChange('<div>typed last</div>');
    const { created, rendered } = roots;

    element.remove();

    expect(events).toHaveLength(1);
    expect(element.session.value).toBe('<div>typed last</div>');
    expect(roots.created).toBe(created);
    expect(roots.rendered).toBe(rendered);

    vi.advanceTimersByTime(2000);
    expect(events).toHaveLength(1);
  });

  it("sends a response editor's pending idle save when a player commits", () => {
    const { element, events } = mount();
    editors.onFlush = () => element.valueChange('<div>typed last</div>');

    element.commitPendingSession();

    expect(editors.flushed).toBeGreaterThan(0);
    expect(element.session.value).toBe('<div>typed last</div>');
    expect(events).toHaveLength(1);
    expect(element.isConnected).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(events).toHaveLength(1);
  });

  it('passes the default idle-save delay when no player provides one', () => {
    mount();

    expect(roots.last.props.idleSaveDelay).toBe(1500);
  });

  it("passes the player's idle-save delay, and follows a change", () => {
    const player = inPlayer({ idleSaveDelayMs: 1000 });
    const { element } = mount(player.player);

    expect(roots.last.props.idleSaveDelay).toBe(1000);

    player.setValue({ idleSaveDelayMs: 0 });
    expect(roots.last.props.idleSaveDelay).toBe(0);

    element.remove();
    expect(player.subscribers.size).toBe(0);
  });
});
