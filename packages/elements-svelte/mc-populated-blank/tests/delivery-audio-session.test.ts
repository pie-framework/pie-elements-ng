/**
 * What this element adds to the delivery session contract, which
 * `@pie-lib/delivery-events-svelte` tests for every Svelte element: audio
 * timing written into the player's session, and completeness that can wait for
 * the audio to finish.
 *
 * `TAG` stands in for the versioned tag a player registers the element under.
 * The first block drives the element's `onAudioStarted` and `onAudioEnded`,
 * the callback props the component's audio player calls; the second also picks
 * choices in the rendered component, which mounts a microtask after connect.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import McPopulatedBlankElement from '../src/delivery/index.js';

const TAG = 'mc-populated-blank--version-0-0-0-audio-session-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, McPopulatedBlankElement as unknown as CustomElementConstructor);
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

const AUDIO_MODEL = {
  ...MODEL,
  hasAudio: true,
  audioUrl: 'https://example.com/a.mp3',
  autoplayAudioEnabled: true,
  completeAudioEnabled: true,
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

beforeEach(() => {
  // happy-dom dispatches `playing` inside `play()`, so autoplay would call
  // `onAudioStarted` from within the component's effect; a browser queues it
  // as a task. Playback never starts here: the tests call the audio callbacks.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
});

afterEach(() => {
  harness?.stop();
  harness = null;
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('mc-populated-blank audio session', () => {
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

  it('reports a pick incomplete until the audio it must wait for has ended', () => {
    const { element, atDocument } = mount(undefined, AUDIO_MODEL);

    element.onSessionChange({ id: '1', element: TAG, choiceId: 'a' });
    expect(atDocument.at(-1)?.detail.complete).toBe(false);

    element.onAudioEnded();
    expect(atDocument.at(-1)?.detail.complete).toBe(true);
  });

  it('stays complete when the player re-sets the model after the audio ended', () => {
    // Autoplay re-fires only for a new `audioUrl`, so the finished playback
    // must survive a re-set of the same model.
    const { element, atDocument } = mount(undefined, AUDIO_MODEL);
    element.onSessionChange({ id: '1', element: TAG, choiceId: 'a' });

    element.onAudioEnded();
    element.model = { ...AUDIO_MODEL };
    element.onSessionChange({ id: '1', element: TAG, choiceId: 'b' });

    expect(atDocument.at(-1)?.detail.complete).toBe(true);
  });

  it('waits for the audio again when the model brings a new `audioUrl`', () => {
    const { element, atDocument } = mount(undefined, AUDIO_MODEL);
    element.onAudioEnded();

    element.model = { ...AUDIO_MODEL, audioUrl: 'https://example.com/b.mp3' };
    element.onSessionChange({ id: '1', element: TAG, choiceId: 'b' });

    expect(atDocument.at(-1)?.detail.complete).toBe(false);
  });
});

describe('mc-populated-blank audio session, through the rendered component', () => {
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
});
