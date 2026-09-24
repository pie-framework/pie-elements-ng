import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/delivery/main.js', () => ({ default: () => null }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
vi.mock('@pie-lib/render-ui', () => ({
  default: { EnableAudioAutoplayImage: () => null },
  EnableAudioAutoplayImage: () => null,
}));
vi.mock('react-dom/client', () => ({
  createRoot: () => ({ render: () => {}, unmount: () => {} }),
}));

const { default: MultipleChoice } = await import('../src/delivery/index.js');

const TAG = 'pie-multiple-choice-session-commit-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, MultipleChoice as CustomElementConstructor);
}

function mount() {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  const events: CustomEvent[] = [];
  element.model = {
    choiceMode: 'radio',
    prompt: 'p',
    language: 'en-US',
    choices: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
  };
  element.session = {};
  // Drain the setter-driven notification so the assertions below count only
  // what a learner interaction produces.
  vi.advanceTimersByTime(100);
  element.addEventListener('session-changed', (event: Event) => {
    events.push(event as CustomEvent);
  });
  return { element, events };
}

describe('multiple-choice session commit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('writes the selection to the session before the notification runs', () => {
    const { element, events } = mount();

    element._onChange({ value: 'a', selected: true });

    expect(element.session.value).toEqual(['a']);
    expect(events).toHaveLength(0);
  });

  it('commits the pending notification on teardown', () => {
    const { element, events } = mount();

    element._onChange({ value: 'a', selected: true });
    element.remove();

    expect(events).toHaveLength(1);
    expect(element.session.value).toEqual(['a']);
  });

  it('does not dispatch twice when the notification already ran', () => {
    const { element, events } = mount();

    element._onChange({ value: 'a', selected: true });
    vi.advanceTimersByTime(10);
    expect(events).toHaveLength(1);

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

    element._onChange({ value: 'a', selected: true });
    expect(atDocument).toHaveLength(0);
    element.commitPendingSession();
    document.removeEventListener('session-changed', listener);

    expect(atDocument).toHaveLength(1);
    expect(element.isConnected).toBe(true);
    expect(element.session.value).toEqual(['a']);
  });
});
