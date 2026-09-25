/**
 * The session contract between a Svelte delivery element and a player, run
 * against every element built on `defineDeliveryElement`.
 *
 * A player creates each session entry with `findOrAddSession(session, model.id,
 * model.element)`, hands that object to `element.session`, and reads the
 * learner's response back off the same object: `pie-player` pushes its entry
 * into the host's own `session.data` array, and `pie-item-player`'s renderer
 * forwards the array it holds. An element that replaced its own reference
 * instead left the response inside the element (PIE-1058). The player also owns
 * the entry's `id` and `element`: it registers the element under a versioned tag
 * and stamps that tag on the entry. On load it sets `element.model = …;
 * element.session = …` in one task, or the session first and the same object
 * again after the model.
 *
 * The first block drives `onSessionChange`, the callback prop the component
 * calls, directly; the second responds through the rendered component, which
 * mounts a microtask after connect.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { flushSync } from 'svelte';
import McPopulatedBlankElement from '../../../elements-svelte/mc-populated-blank/src/delivery/index.js';
import SimpleClozeElement from '../../../elements-svelte/simple-cloze/src/delivery/index.js';
import { model as simpleClozeModel } from '../../../elements-svelte/simple-cloze/src/controller/index.js';
import VennClassificationElement from '../../../elements-svelte/venn-classification/src/delivery/index.js';
import { model as vennModel } from '../../../elements-svelte/venn-classification/src/controller/index.js';
import type { VennModel } from '../../../elements-svelte/venn-classification/src/types.js';

type Session = Record<string, unknown>;
type Element = HTMLElement & {
  model: unknown;
  session: unknown;
  onSessionChange: (session: Session) => void;
};

interface ElementUnderTest {
  name: string;
  Element: CustomElementConstructor;
  /** The view model a player sets for `session`, as its controller builds it. */
  model(tag: string, session: Session): Promise<unknown>;
  /** One learner response through the rendered component. */
  respond(element: HTMLElement): void;
  /** What `respond` writes into the session. */
  response: Session;
  /** Session content that is, and is not, a complete response. */
  complete: Session;
  incomplete: Session;
  /** Whether the rendered component shows a response. */
  showsResponse(element: HTMLElement): boolean;
}

const GATHER = { mode: 'gather', role: 'student' };

const mcPopulatedBlank: ElementUnderTest = {
  name: 'mc-populated-blank',
  Element: McPopulatedBlankElement as unknown as CustomElementConstructor,
  model: async (tag) => ({
    id: '1',
    element: tag,
    template: '<p>{{blank}}</p>',
    choiceMode: 'text',
    choices: [
      { id: 'a', labelHtml: 'louk' },
      { id: 'b', labelHtml: 'look' },
    ],
    correctChoiceId: 'b',
    interactionMode: 'populate_blank',
    mode: 'gather',
  }),
  respond: (element) => {
    const input = element.querySelectorAll<HTMLInputElement>('input[type="radio"]')[1];
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  },
  response: { choiceId: 'b' },
  complete: { choiceId: 'a' },
  incomplete: {},
  showsResponse: (element) => !!element.querySelector('input[type="radio"]:checked'),
};

const simpleClozeInput = (element: HTMLElement) => {
  const input = element.querySelector<HTMLInputElement>('input[type="text"]');
  if (!input) throw new Error('response input not rendered');
  return input;
};

const simpleCloze: ElementUnderTest = {
  name: 'simple-cloze',
  Element: SimpleClozeElement as unknown as CustomElementConstructor,
  model: (tag, session) =>
    simpleClozeModel(
      { id: '1', element: tag, prompt: '<p>What is 2 + 2?</p>', correctAnswer: '4' },
      session,
      GATHER
    ),
  respond: (element) => {
    const input = simpleClozeInput(element);
    input.value = '4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  },
  response: { value: '4' },
  complete: { value: '4' },
  incomplete: { value: '   ' },
  showsResponse: (element) => simpleClozeInput(element).value !== '',
};

const vennTiles = (element: HTMLElement) =>
  [...element.querySelectorAll<HTMLButtonElement>('button[data-tile-id]')].filter(
    (tile) => tile.getAttribute('aria-hidden') !== 'true'
  );

const vennClassification: ElementUnderTest = {
  name: 'venn-classification',
  Element: VennClassificationElement as unknown as CustomElementConstructor,
  model: async (tag, session) => {
    const question: VennModel = {
      id: '1',
      element: tag,
      circles: [{ label: 'Reptile' }, { label: 'Egg-layer' }],
      tiles: [
        { id: 'crocodile', label: 'Crocodile', correctRegion: [0, 1] },
        { id: 'frog', label: 'Frog', correctRegion: [1] },
      ],
    };
    return { id: question.id, element: tag, ...(await vennModel(question, session, GATHER)) };
  },
  // Picks the crocodile up and drops it on the preselected target.
  respond: (element) => {
    const [crocodile] = vennTiles(element);
    for (const key of [' ', 'Enter']) {
      crocodile.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
      );
      flushSync();
    }
  },
  response: { placements: { crocodile: [0], frog: null }, completed: false },
  complete: { placements: { crocodile: [0, 1], frog: [1] }, completed: true },
  incomplete: { placements: { crocodile: [0, 1], frog: null }, completed: false },
  showsResponse: (element) =>
    vennTiles(element).some((tile) => !tile.closest('[data-region-key="tray"]')),
};

const ELEMENTS = [mcPopulatedBlank, simpleCloze, vennClassification];

const tagFor = (name: string) => `${name}--version-0-0-0-session-contract-test`;
for (const { name, Element } of ELEMENTS) {
  if (!customElements.get(tagFor(name))) customElements.define(tagFor(name), Element);
}

const MATH_RENDERER_KEY = '@pie-lib/math-rendering';

beforeEach(() => {
  // A player that renders math itself, so no element loads MathJax here.
  (window as unknown as Record<string, unknown>)[MATH_RENDERER_KEY] = { renderMath: () => {} };
});

const stops: Array<() => void> = [];

afterEach(() => {
  for (const stop of stops.splice(0)) stop();
  delete (window as unknown as Record<string, unknown>)[MATH_RENDERER_KEY];
  document.body.innerHTML = '';
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

/** Every `model-set` and `session-changed` at the document, in order. */
function record() {
  const events: Array<{ type: string; detail: { complete: boolean; component: string } }> = [];
  const listener = (event: Event) =>
    events.push({ type: event.type, detail: (event as CustomEvent).detail });
  document.addEventListener('model-set', listener);
  document.addEventListener('session-changed', listener);
  stops.push(() => {
    document.removeEventListener('model-set', listener);
    document.removeEventListener('session-changed', listener);
  });
  return {
    events,
    sessionChanged: () => events.filter((e) => e.type === 'session-changed').map((e) => e.detail),
  };
}

describe.each(ELEMENTS)('$name session contract', (subject) => {
  const TAG = tagFor(subject.name);

  function create(): Element {
    const element = document.createElement(TAG) as Element;
    document.body.appendChild(element);
    return element;
  }

  /** What a player does on load, then the component's first render. */
  async function mount(playerSession: Session = { id: '1', element: TAG }) {
    const element = create();
    element.model = await subject.model(TAG, playerSession);
    element.session = playerSession;
    await settle();
    return { element, playerSession };
  }

  describe('through onSessionChange', () => {
    it('writes an update into the session object the player handed it', async () => {
      const { element, playerSession } = await mount();

      element.onSessionChange({ id: '1', element: TAG, ...subject.complete });

      expect(playerSession).toEqual({ id: '1', element: TAG, ...subject.complete });
      expect(element.session).toBe(playerSession);
    });

    it("announces each update under the player's tag, `complete` following the response", async () => {
      const { element } = await mount();
      const recorded = record();

      element.onSessionChange({ id: '1', element: TAG, ...subject.incomplete });
      element.onSessionChange({ id: '1', element: TAG, ...subject.complete });

      expect(recorded.sessionChanged()).toEqual([
        { complete: false, component: TAG },
        { complete: true, component: TAG },
      ]);
    });

    it('keeps writing through after the player replaces the session object', async () => {
      const { element, playerSession } = await mount();
      element.onSessionChange({ id: '1', element: TAG, ...subject.incomplete });

      const replacement: Session = { id: '2', element: TAG };
      element.session = replacement;
      element.onSessionChange({ id: '2', element: TAG, ...subject.complete });

      expect(replacement).toEqual({ id: '2', element: TAG, ...subject.complete });
      expect(playerSession).toEqual({ id: '1', element: TAG, ...subject.incomplete });
    });

    it('returns a replacement it could not write into a frozen session', async () => {
      const frozen = Object.freeze({ id: '1', element: TAG });
      const { element } = await mount(frozen);

      element.onSessionChange({ id: '1', element: TAG, ...subject.complete });

      expect(element.session).toEqual({ id: '1', element: TAG, ...subject.complete });
      expect(frozen).toEqual({ id: '1', element: TAG });
    });

    it('leaves no pending dispatch for a player to commit', async () => {
      // The element dispatches synchronously, so a teardown commit has nothing to
      // flush and must not find a `commitPendingSession` hook: a player that sees
      // one skips synthesizing an event from `element.session`.
      const { element } = await mount();

      expect('commitPendingSession' in element).toBe(false);
    });
  });

  describe('on load', () => {
    it('reports a restored complete session as complete on model-set', async () => {
      const recorded = record();
      const playerSession = { id: '1', element: TAG, ...subject.complete };
      const element = create();

      element.model = await subject.model(TAG, playerSession);
      element.session = playerSession;
      await settle();

      expect(recorded.events.filter((e) => e.type === 'model-set').map((e) => e.detail)).toEqual([
        { complete: true, component: TAG, hasModel: true },
      ]);
    });

    it('reports a restored complete session as complete after the model arrives', async () => {
      const recorded = record();
      const playerSession = { id: '1', element: TAG, ...subject.complete };
      const element = create();

      element.session = playerSession;
      element.model = await subject.model(TAG, playerSession);
      element.session = playerSession;
      await settle();

      expect(recorded.sessionChanged().at(-1)).toEqual({ complete: true, component: TAG });
    });
  });

  describe('through the rendered component', () => {
    it("writes a response into the player's session, keeping its `id` and versioned `element`", async () => {
      const { element, playerSession } = await mount();

      subject.respond(element);
      flushSync();

      expect(playerSession).toEqual({ id: '1', element: TAG, ...subject.response });
      expect(element.session).toBe(playerSession);
      expect(subject.showsResponse(element)).toBe(true);
    });

    it('writes neither `id` nor `element` when the player set none', async () => {
      const { element, playerSession } = await mount({});

      subject.respond(element);
      flushSync();

      expect(playerSession).toEqual(subject.response);
    });

    it('announces the response once', async () => {
      const { element } = await mount();
      const recorded = record();

      subject.respond(element);
      flushSync();

      expect(recorded.sessionChanged()).toHaveLength(1);
      expect(recorded.sessionChanged()[0].component).toBe(TAG);
    });

    it('re-renders when the player clears the session in place', async () => {
      const { element, playerSession } = await mount();
      subject.respond(element);
      flushSync();
      const recorded = record();

      for (const key of Object.keys(playerSession)) delete playerSession[key];
      Object.assign(playerSession, { id: '1', element: TAG });
      element.session = playerSession;
      flushSync();

      expect(subject.showsResponse(element)).toBe(false);
      expect(recorded.sessionChanged()).toEqual([{ complete: false, component: TAG }]);
    });

    it('builds the next response on a replacement session', async () => {
      const { element, playerSession } = await mount();
      subject.respond(element);
      flushSync();

      const replacement: Session = { id: '2', element: TAG };
      element.session = replacement;
      flushSync();
      expect(subject.showsResponse(element)).toBe(false);

      subject.respond(element);
      flushSync();
      expect(replacement).toEqual({ id: '2', element: TAG, ...subject.response });
      expect(playerSession).toEqual({ id: '1', element: TAG, ...subject.response });
    });
  });
});
