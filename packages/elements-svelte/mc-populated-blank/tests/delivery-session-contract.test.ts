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
 * The player also owns the entry's `id` and `element`: it registers the element
 * under a versioned tag and stamps that tag on the entry. `TAG` stands in for
 * it. The first block drives the wrapper's `onSessionChange` directly, the seam
 * the Svelte component reaches through `forwardSessionChange`; the second picks
 * choices in the rendered component, which mounts a microtask after connect.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import McPopulatedBlankElement from '../src/delivery/index.js';

const TAG = 'mc-populated-blank--version-0-0-0-session-contract-test';
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

function mount(
  playerSession: Record<string, unknown> = { id: '1', element: TAG },
  model: Record<string, unknown> = MODEL
): Harness {
  const element = document.createElement(TAG) as any;
  document.body.appendChild(element);
  element.model = { ...model };
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

async function mountRendered(playerSession?: Record<string, unknown>): Promise<Harness> {
  const mounted = mount(playerSession);
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
  return mounted;
}

function pick(element: HTMLElement, index: number) {
  const input = element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[index];
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  flushSync();
}

afterEach(() => {
  harness?.stop();
  harness = null;
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('mc-populated-blank session contract', () => {
  it('writes the selection into the session object the player handed it', () => {
    const { element, playerSession } = mount();

    element.onSessionChange({ id: '1', element: TAG, choiceId: 'b' });

    expect(playerSession).toEqual({ id: '1', element: TAG, choiceId: 'b' });
    expect(element.session.choiceId).toBe('b');
  });

  it('announces the change to a document-level listener', () => {
    const { element, atDocument } = mount();

    element.onSessionChange({ id: '1', element: TAG, choiceId: 'b' });

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
    element.onSessionChange({ id: '1', element: TAG });
    expect(atDocument[0].detail.complete).toBe(false);

    element.onSessionChange({ id: '1', element: TAG, choiceId: 'a' });
    expect(atDocument[1].detail.complete).toBe(true);
  });

  it('keeps writing through after the player replaces the session object', () => {
    // A config swap sets a new session; the element must follow the new object,
    // not keep writing into the discarded one.
    const { element, playerSession } = mount();
    element.onSessionChange({ id: '1', element: TAG, choiceId: 'a' });

    const replacement: Record<string, unknown> = { id: '2', element: TAG };
    element.session = replacement;
    element.onSessionChange({ id: '2', element: TAG, choiceId: 'b' });

    expect(replacement.choiceId).toBe('b');
    expect(playerSession.choiceId).toBe('a');
  });

  it('writes audio timing and `waitTime` into the player session', () => {
    // Star reads `waitTime` off the session. As multiple-choice records it, the
    // first playback counts and a replay moves neither timestamp.
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(4000).mockReturnValue(9000);
    const { element, playerSession } = mount();

    element.onAudioStarted();
    element.onAudioEnded();
    element.onAudioStarted();

    expect(playerSession).toEqual({
      id: '1',
      element: TAG,
      audioStartTime: 1000,
      audioEndTime: 4000,
      waitTime: 3000,
    });
  });

  it('stays complete when the player re-sets the model after the audio ended', () => {
    // Autoplay re-fires only for a new `audioUrl`, so the finished playback
    // must survive a re-set of the same model.
    const audioModel = {
      ...MODEL,
      hasAudio: true,
      audioUrl: 'https://example.com/a.mp3',
      autoplayAudioEnabled: true,
      completeAudioEnabled: true,
    };
    const { element, atDocument } = mount(undefined, audioModel);
    element.onSessionChange({ id: '1', element: TAG, choiceId: 'a' });
    expect(atDocument.at(-1)?.detail.complete).toBe(false);

    element.onAudioEnded();
    element.model = { ...audioModel };
    element.onSessionChange({ id: '1', element: TAG, choiceId: 'b' });

    expect(atDocument.at(-1)?.detail.complete).toBe(true);
  });

  it('leaves no pending dispatch for a player to commit', () => {
    // The element dispatches synchronously, so a teardown commit has nothing to
    // flush and must not find a `commitPendingSession` hook: a player that sees
    // one skips synthesizing an event from `element.session`.
    const { element } = mount();

    expect('commitPendingSession' in element).toBe(false);
  });
});

describe('mc-populated-blank session contract, through the rendered component', () => {
  it("keeps the player's `id` and versioned `element` on the session", async () => {
    const { element, playerSession } = await mountRendered();

    pick(element, 1);

    expect(playerSession).toEqual({ id: '1', element: TAG, choiceId: 'b' });
  });

  it('writes neither `id` nor `element` when the player set none', async () => {
    const { element, playerSession } = await mountRendered({});

    pick(element, 1);

    expect(playerSession).toEqual({ choiceId: 'b' });
  });

  it("keeps audio timing through the learner's next pick", async () => {
    // A pick is built from the session the component renders; timing written
    // only into the player's object was dropped by the next write.
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(4000);
    const { element, playerSession } = await mountRendered();

    element.onAudioStarted();
    pick(element, 0);
    element.onAudioEnded();
    pick(element, 1);

    expect(playerSession).toEqual({
      id: '1',
      element: TAG,
      choiceId: 'b',
      audioStartTime: 1000,
      audioEndTime: 4000,
      waitTime: 3000,
    });
  });

  it('clears the selection when the player resets the session', async () => {
    const { element } = await mountRendered();
    pick(element, 0);

    element.session = { id: '1', element: TAG };
    flushSync();

    expect(element.querySelector('input[type="radio"]:checked')).toBeNull();
  });
});
