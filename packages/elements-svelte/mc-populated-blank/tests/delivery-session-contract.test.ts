/**
 * The session contract between this element and a player.
 *
 * A player hands the element a session object and reads the learner's response
 * back off that object: `pie-player` pushes its entry into the host's own
 * `session.data` array, and `pie-item-player`'s renderer forwards the array it
 * holds. This element replaced its own reference instead of writing into that
 * object, so the response stayed inside the element: the forwarded container
 * compared equal to the previous one and normalized to `session: null` with
 * `intent: "metadata-only"` - which is what Quiz Engine saw.
 *
 * These tests drive the wrapper's `onSessionChange` directly, which is the seam
 * the Svelte component reaches through `forwardSessionChange`. The component's
 * own end of it is covered in `src/delivery/McPopulatedBlank.session.test.ts`;
 * the component does not render under the root vitest config, which compiles
 * without `customElement: true`.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import McPopulatedBlankElement from '../src/delivery/index.js';

const TAG = 'mc-populated-blank-session-contract-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, McPopulatedBlankElement as CustomElementConstructor);
}

const MODEL = {
  id: '1',
  element: 'mc-populated-blank',
  template: '<p>{{blank}}</p>',
  choiceMode: 'text',
  choices: [
    { id: 'a', labelHtml: 'louk' },
    { id: 'b', labelHtml: 'look' },
  ],
  correctChoiceId: 'b',
  interactionMode: 'populate_blank',
  mode: 'gather',
};

type Harness = {
  element: any;
  playerSession: Record<string, unknown>;
  atDocument: CustomEvent[];
  stop: () => void;
};

let harness: Harness | null = null;

function mount(): Harness {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  const playerSession: Record<string, unknown> = { id: '1', element: 'mc-populated-blank' };
  element.model = { ...MODEL };
  element.session = playerSession;

  const atDocument: CustomEvent[] = [];
  const listener = (event: Event) => atDocument.push(event as CustomEvent);
  document.addEventListener('session-changed', listener);
  harness = {
    element,
    playerSession,
    atDocument,
    stop: () => document.removeEventListener('session-changed', listener),
  };
  return harness;
}

afterEach(() => {
  harness?.stop();
  harness = null;
  document.body.innerHTML = '';
});

describe('mc-populated-blank session contract', () => {
  it('writes the selection into the session object the player handed it', () => {
    const { element, playerSession } = mount();

    element.onSessionChange({
      id: '1',
      element: 'mc-populated-blank',
      choiceId: 'b',
    });

    expect(playerSession).toEqual({ id: '1', element: 'mc-populated-blank', choiceId: 'b' });
    expect(element.session.choiceId).toBe('b');
  });

  it('announces the change to a document-level listener', () => {
    const { element, atDocument } = mount();

    element.onSessionChange({ id: '1', element: 'mc-populated-blank', choiceId: 'b' });

    expect(atDocument).toHaveLength(1);
    expect(atDocument[0].detail).toEqual({
      complete: true,
      component: TAG,
    });
  });

  it('reports incomplete until a choice is selected', () => {
    const { element, atDocument } = mount();

    // The `set session` echo is the first event; `complete` turns on with the
    // response, which is what gates the host's answered state.
    expect(atDocument).toHaveLength(0);
    element.onSessionChange({ id: '1', element: 'mc-populated-blank' });
    expect(atDocument[0].detail.complete).toBe(false);

    element.onSessionChange({ id: '1', element: 'mc-populated-blank', choiceId: 'a' });
    expect(atDocument[1].detail.complete).toBe(true);
  });

  it('keeps writing through after the player replaces the session object', () => {
    // A config swap sets a new session; the element must follow the new object,
    // not keep writing into the discarded one.
    const { element, playerSession } = mount();
    element.onSessionChange({ id: '1', element: 'mc-populated-blank', choiceId: 'a' });

    const replacement: Record<string, unknown> = { id: '2', element: 'mc-populated-blank' };
    element.session = replacement;
    element.onSessionChange({ id: '2', element: 'mc-populated-blank', choiceId: 'b' });

    expect(replacement.choiceId).toBe('b');
    expect(playerSession.choiceId).toBe('a');
  });

  it('writes audio timing into the player session too', () => {
    // Star reads `waitTime` off the session; the audio handlers replaced the
    // reference the same way the response did.
    const { element, playerSession } = mount();

    element.onAudioStarted();
    element.onAudioEnded();

    expect(typeof playerSession.audioStartTime).toBe('number');
    expect(typeof playerSession.audioEndTime).toBe('number');
  });

  it('leaves no pending dispatch for a player to commit', () => {
    // The element dispatches synchronously, so a teardown commit has nothing to
    // flush and must not find a `commitPendingSession` hook: a player that sees
    // one skips synthesizing an event from `element.session`.
    const { element } = mount();

    expect('commitPendingSession' in element).toBe(false);
  });
});
