/**
 * The session contract between this element and a player, through the rendered
 * custom element.
 *
 * A player creates the session entry with `findOrAddSession(session, model.id,
 * model.element)`, so the entry carries an `id` and the versioned tag it
 * registered the element under; `TAG` stands in for that tag. On load it sets
 * `element.session` before the model, then `element.model = …; element.session
 * = sameObject` once the controller has run, and it reads the learner's
 * response back off that same object. The section player gates completion on
 * the `complete` flag of `session-changed`.
 *
 * The component mounts a microtask after connect, and happy-dom lays nothing
 * out, so the diagram and tray rects are stubbed: the diagram fills
 * (0,0)-(900,540), which makes client coordinates equal viewBox coordinates,
 * and the tray sits below it.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

const { renderMath } = vi.hoisted(() => ({ renderMath: vi.fn() }));
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath }));

import VennClassificationElement from '../src/delivery/index.js';
import { model as controllerModel } from '../src/controller/index.js';
import type { VennModel, VennSession } from '../src/types.js';

const TAG = 'venn-classification--version-0-0-0-session-contract-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, VennClassificationElement as unknown as CustomElementConstructor);
}

const QUESTION: VennModel = {
  id: '1',
  element: TAG,
  prompt: '<p>Sort each animal.</p>',
  circles: [{ label: 'Reptile' }, { label: 'Egg-layer' }],
  tiles: [
    { id: 'crocodile', label: 'Crocodile', correctRegion: [0, 1] },
    { id: 'frog', label: 'Frog', correctRegion: [1] },
    { id: 'dolphin', label: 'Dolphin', correctRegion: [] },
  ],
};

const GATHER = { mode: 'gather', role: 'student' };
const EVALUATE = { mode: 'evaluate', role: 'student' };

/** Client points inside each drop target, given the stubbed rects. */
const POINT = {
  '0': { x: 240, y: 210 },
  '0,1': { x: 450, y: 210 },
  '1': { x: 660, y: 210 },
  '': { x: 450, y: 500 },
  tray: { x: 450, y: 650 },
} as const;

type PlayerSession = VennSession & Record<string, unknown>;
type Env = { mode: string; role: string };

type Harness = {
  element: HTMLElement & { session: unknown; model: unknown };
  playerSession: PlayerSession;
  events: CustomEvent[];
  stop: () => void;
};

const harnesses: Harness[] = [];

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return {
    x,
    y,
    left: x,
    top: y,
    width,
    height,
    right: x + width,
    bottom: y + height,
    toJSON: () => ({}),
  } as DOMRect;
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    if (this.classList.contains('venn-diagram')) return rect(0, 0, 900, 540);
    if (this.dataset.regionKey === 'tray') return rect(0, 600, 900, 120);
    return rect(0, 0, 0, 0);
  });
  // Announcements land a frame later; run them now so the live region is readable.
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  for (const h of harnesses.splice(0)) h.stop();
  renderMath.mockReset();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

async function settle() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  flushSync();
}

/** What a player does on load: session, controller, model, the same session again. */
async function mount(
  playerSession: PlayerSession = { id: '1', element: TAG },
  env: Env = GATHER,
  question: VennModel = QUESTION
): Promise<Harness> {
  const events: CustomEvent[] = [];
  const listener = (event: Event) => events.push(event as CustomEvent);
  document.addEventListener('session-changed', listener);

  const element = document.createElement(TAG) as Harness['element'];
  document.body.appendChild(element);
  element.session = playerSession;
  const vm = await controllerModel(question, playerSession, env);
  element.model = { id: question.id, element: question.element, ...vm };
  element.session = playerSession;
  await settle();

  const harness = {
    element,
    playerSession,
    events,
    stop: () => document.removeEventListener('session-changed', listener),
  };
  harnesses.push(harness);
  return harness;
}

/** What a player does on a mode change: a new model, then the same session. */
async function switchMode(h: Harness, env: Env) {
  const vm = await controllerModel(QUESTION, h.playerSession, env);
  h.element.model = { id: QUESTION.id, element: QUESTION.element, ...vm };
  h.element.session = h.playerSession;
  flushSync();
}

function tile(h: Harness, id: string): HTMLButtonElement {
  const found = [...h.element.querySelectorAll<HTMLButtonElement>('button[data-tile-id]')].find(
    (b) => b.dataset.tileId === id && b.getAttribute('aria-hidden') !== 'true'
  );
  if (!found) throw new Error(`tile ${id} is not rendered`);
  return found;
}

function where(h: Harness, id: string): 'tray' | 'diagram' {
  return tile(h, id).closest('[data-region-key="tray"]') ? 'tray' : 'diagram';
}

function key(target: HTMLElement, k: string) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  flushSync();
}

function pointer(target: EventTarget, type: string, at: { x: number; y: number }) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      clientX: at.x,
      clientY: at.y,
    })
  );
  flushSync();
}

function drag(
  h: Harness,
  id: string,
  from: { x: number; y: number },
  to: { x: number; y: number }
) {
  pointer(tile(h, id), 'pointerdown', from);
  pointer(window, 'pointermove', to);
  pointer(window, 'pointerup', to);
}

function announced(h: Harness): string {
  return h.element.querySelector('[aria-live]')?.textContent ?? '';
}

const placedEverywhere = (): PlayerSession => ({
  id: '1',
  element: TAG,
  placements: { crocodile: [1], frog: [1], dolphin: [0, 1] },
  completed: true,
});

describe('venn-classification session contract', () => {
  it("writes a placement into the player's session, keeping its `id` and versioned `element`", async () => {
    const h = await mount();

    drag(h, 'frog', POINT.tray, POINT['1']);

    expect(h.playerSession).toEqual({
      id: '1',
      element: TAG,
      placements: { crocodile: null, frog: [1], dolphin: null },
      completed: false,
    });
  });

  it('carries a key for every tile from the first placement on', async () => {
    const h = await mount();

    key(tile(h, 'crocodile'), ' ');
    key(tile(h, 'crocodile'), 'Enter');

    expect(Object.keys(h.playerSession.placements ?? {}).sort()).toEqual([
      'crocodile',
      'dolphin',
      'frog',
    ]);
    expect(h.playerSession.placements).toEqual({ crocodile: [0], frog: null, dolphin: null });
  });

  it('writes nothing into the session before the first placement', async () => {
    // A player counts a session with content as a response.
    const h = await mount();

    expect(h.playerSession).toEqual({ id: '1', element: TAG });
  });

  it('names the registered tag as `component` on session-changed', async () => {
    const h = await mount();
    const before = h.events.length;

    drag(h, 'frog', POINT.tray, POINT['1']);

    expect(h.events).toHaveLength(before + 1);
    expect(h.events.at(-1)?.detail).toEqual({ complete: false, component: TAG });
  });

  it('reports a restored complete session as complete after the model arrives', async () => {
    const h = await mount(placedEverywhere());

    expect(h.events.at(-1)?.detail).toEqual({ complete: true, component: TAG });
  });

  it('flips `complete` on the last placement', async () => {
    const h = await mount({
      id: '1',
      element: TAG,
      placements: { crocodile: [0, 1], frog: [1], dolphin: null },
      completed: false,
    });

    drag(h, 'dolphin', POINT.tray, POINT['']);

    expect(h.playerSession.completed).toBe(true);
    expect(h.events.at(-1)?.detail.complete).toBe(true);
  });

  it('re-renders when the player resets the session in place', async () => {
    const h = await mount(placedEverywhere());
    expect(where(h, 'crocodile')).toBe('diagram');

    h.playerSession.placements = { crocodile: null, frog: null, dolphin: null };
    h.playerSession.completed = false;
    h.element.session = h.playerSession;
    flushSync();

    expect(where(h, 'crocodile')).toBe('tray');
    expect(where(h, 'frog')).toBe('tray');
    expect(h.events.at(-1)?.detail.complete).toBe(false);
  });

  it('commits nothing for a click that does not move the tile', async () => {
    const h = await mount();
    const before = h.events.length;

    drag(h, 'crocodile', POINT.tray, POINT.tray);

    expect(h.playerSession).toEqual({ id: '1', element: TAG });
    expect(h.events).toHaveLength(before);
  });

  it('commits nothing when a drag is released after the element turned read-only', async () => {
    const h = await mount(placedEverywhere());
    pointer(tile(h, 'crocodile'), 'pointerdown', POINT['1']);

    await switchMode(h, EVALUATE);
    const before = h.events.length;
    pointer(window, 'pointermove', POINT.tray);
    pointer(window, 'pointerup', POINT.tray);

    expect(h.playerSession.placements).toEqual({ crocodile: [1], frog: [1], dolphin: [0, 1] });
    expect(h.events).toHaveLength(before);
  });

  it('commits nothing when the browser cancels the drag', async () => {
    // A pointercancel is the browser taking the gesture over, e.g. to scroll.
    const h = await mount();
    const before = h.events.length;
    pointer(tile(h, 'crocodile'), 'pointerdown', POINT.tray);
    pointer(window, 'pointermove', POINT['1']);
    pointer(window, 'pointercancel', POINT['1']);

    expect(h.playerSession).toEqual({ id: '1', element: TAG });
    expect(h.events).toHaveLength(before);
    expect(where(h, 'crocodile')).toBe('tray');
    expect(announced(h)).toBe('Cancelled');
  });

  it('removes its drag listeners from `window` when it is removed mid-drag', async () => {
    const added = new Set<unknown>();
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const h = await mount();

    pointer(tile(h, 'crocodile'), 'pointerdown', POINT.tray);
    for (const [type, fn] of addSpy.mock.calls) if (type === 'pointerup') added.add(fn);
    expect(added.size).toBeGreaterThan(0);

    h.element.remove();
    await settle();

    const removed = new Set(
      removeSpy.mock.calls.filter(([type]) => type === 'pointerup').map(([, fn]) => fn)
    );
    for (const fn of added) expect(removed.has(fn)).toBe(true);
  });
});

describe('venn-classification keyboard placement', () => {
  it('keeps focus on the tile it drops', async () => {
    const h = await mount();
    tile(h, 'crocodile').focus();

    key(tile(h, 'crocodile'), ' ');
    key(tile(h, 'crocodile'), 'ArrowRight');
    key(tile(h, 'crocodile'), 'Enter');
    await settle();

    expect(where(h, 'crocodile')).toBe('diagram');
    expect(document.activeElement).toBe(tile(h, 'crocodile'));
    expect(h.playerSession.placements?.crocodile).toEqual([0, 1]);
  });

  it('announces the preselected drop target on pickup', async () => {
    const h = await mount();

    key(tile(h, 'crocodile'), ' ');

    expect(announced(h)).toMatch(/^Picked up Crocodile, drop target: Reptile only\b/);
  });

  it("starts a placed tile's pickup at the region it is in", async () => {
    const h = await mount(placedEverywhere());
    const before = h.events.length;

    key(tile(h, 'frog'), ' ');
    expect(announced(h)).toMatch(/^Picked up Frog, drop target: Egg-layer only\b/);
    key(tile(h, 'frog'), 'Enter');

    // Dropping where it already is changes nothing.
    expect(h.playerSession.placements?.frog).toEqual([1]);
    expect(h.events).toHaveLength(before);
  });

  it('drops the pickup when focus leaves the component', async () => {
    const h = await mount();
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    tile(h, 'crocodile').focus();
    key(tile(h, 'crocodile'), ' ');
    expect(tile(h, 'crocodile').getAttribute('aria-pressed')).toBe('true');

    outside.focus();
    flushSync();

    expect(tile(h, 'crocodile').getAttribute('aria-pressed')).toBe('false');
  });

  it('drops the pickup when the element turns read-only', async () => {
    const h = await mount();
    key(tile(h, 'crocodile'), ' ');
    expect(tile(h, 'crocodile').getAttribute('aria-pressed')).toBe('true');

    await switchMode(h, EVALUATE);

    expect(tile(h, 'crocodile').getAttribute('aria-pressed')).toBe('false');
  });
});

describe('venn-classification evaluate view', () => {
  const evaluated = (): PlayerSession => ({
    id: '1',
    element: TAG,
    placements: { crocodile: [1], frog: [1], dolphin: null },
    completed: false,
  });

  it("names each tile's region and verdict", async () => {
    const h = await mount(evaluated(), EVALUATE);

    expect(tile(h, 'crocodile').getAttribute('aria-label')).toBe(
      'Crocodile, in Egg-layer only, incorrect'
    );
    expect(tile(h, 'frog').getAttribute('aria-label')).toBe('Frog, in Egg-layer only, correct');
    expect(tile(h, 'dolphin').getAttribute('aria-label')).toBe('Dolphin, not placed');
  });

  it("names each tile's region while gathering", async () => {
    const h = await mount(evaluated(), GATHER);

    expect(tile(h, 'crocodile').getAttribute('aria-label')).toBe('Crocodile, in Egg-layer only');
    expect(tile(h, 'dolphin').getAttribute('aria-label')).toBe('Dolphin, not placed');
  });

  it('turns "Show correct answer" off when the mode leaves evaluate', async () => {
    const h = await mount(evaluated(), EVALUATE);
    const toggle = () => h.element.querySelector<HTMLButtonElement>('.toggle-correct');
    toggle()?.click();
    flushSync();
    expect(toggle()?.getAttribute('aria-pressed')).toBe('true');

    await switchMode(h, GATHER);
    await switchMode(h, EVALUATE);

    expect(toggle()?.getAttribute('aria-pressed')).toBe('false');
    expect(where(h, 'dolphin')).toBe('tray');
  });

  it('turns "Show correct answer" off when the player hands over another session', async () => {
    const h = await mount(evaluated(), EVALUATE);
    const toggle = () => h.element.querySelector<HTMLButtonElement>('.toggle-correct');
    toggle()?.click();
    flushSync();

    h.element.session = evaluated();
    flushSync();

    expect(toggle()?.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('venn-classification rendering', () => {
  it('gives each instance its own SVG mask and clip-path ids', async () => {
    const a = await mount();
    const b = await mount();
    const ids = [...document.querySelectorAll('mask[id], clipPath[id]')].map((el) => el.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);

    // Every `url(#…)` an instance draws resolves inside that instance.
    for (const h of [a, b]) {
      key(tile(h, 'crocodile'), ' ');
      key(tile(h, 'crocodile'), 'ArrowRight');
      const refs = [...h.element.querySelectorAll('[mask], [clip-path]')].map(
        (el) =>
          (el.getAttribute('mask') ?? el.getAttribute('clip-path') ?? '').match(/#([^)]+)/)?.[1]
      );
      expect(refs.length).toBeGreaterThan(0);
      for (const ref of refs) expect(h.element.querySelector(`[id="${ref}"]`)).not.toBeNull();
    }
  });

  it('reports a MathJax load failure as a warning, not an unhandled rejection', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderMath.mockImplementation(() => Promise.reject(new Error('Failed to load MathJax')));

    await mount();
    await settle();

    expect(warn).toHaveBeenCalledWith(
      'venn-classification: MathJax render failed',
      expect.any(Error)
    );
  });

  it('shows an error instead of throwing for a circle count it cannot lay out', async () => {
    const threeSet: VennModel = {
      ...QUESTION,
      circles: [{ label: 'A' }, { label: 'B' }, { label: 'C' }],
    };
    const h = await mount(undefined, GATHER, threeSet);

    expect(h.element.querySelector('[role="alert"]')?.textContent).toMatch(/3\s+circles/);
    expect(h.element.querySelector('button[data-tile-id]')).toBeNull();
  });
});
