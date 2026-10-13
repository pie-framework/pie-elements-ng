import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  hasRenderedContent,
  type RenderOutcome,
  watchRender,
} from '../src/lib/a11y/render-readiness';

const quietMs = 100;
const timeoutMs = 1_000;

function mountElement(): HTMLElement {
  const element = document.createElement('pie-test-element');
  document.body.append(element);
  return element;
}

/** Lets MutationObserver records reach the watcher before timers advance. */
async function flushMutations() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('render readiness', () => {
  let outcomes: RenderOutcome[];
  const record = (outcome: RenderOutcome) => outcomes.push(outcome);

  beforeEach(() => {
    vi.useFakeTimers();
    outcomes = [];
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('counts text, controls and media as content, and empty wrappers and styles as none', () => {
    const element = mountElement();
    element.innerHTML = '<div><span> </span></div><style>.x { color: red }</style>';
    expect(hasRenderedContent(element)).toBe(false);

    element.innerHTML = '<div><p>Choose one</p></div>';
    expect(hasRenderedContent(element)).toBe(true);

    element.innerHTML = '<div><svg></svg></div>';
    expect(hasRenderedContent(element)).toBe(true);
  });

  it('reports rendered once content has stayed unchanged for the quiet period', async () => {
    const element = mountElement();
    watchRender(element, record, { quietMs, timeoutMs });

    element.innerHTML = '<p>Choose one</p>';
    await flushMutations();
    await vi.advanceTimersByTimeAsync(quietMs - 10);
    element.querySelector('p')?.append(' answer');
    await flushMutations();
    await vi.advanceTimersByTimeAsync(quietMs - 10);
    expect(outcomes).toEqual([]);

    await vi.advanceTimersByTimeAsync(20);
    expect(outcomes).toEqual(['rendered']);
  });

  it('waits for images to load before reporting rendered', async () => {
    const element = mountElement();
    element.innerHTML = '<p>Drag the tile</p><img alt="tile">';
    const image = element.querySelector('img') as HTMLImageElement;
    let complete = false;
    Object.defineProperty(image, 'complete', { get: () => complete });

    watchRender(element, record, { quietMs, timeoutMs });
    await vi.advanceTimersByTimeAsync(quietMs * 3);
    expect(outcomes).toEqual([]);

    complete = true;
    image.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(quietMs);
    expect(outcomes).toEqual(['rendered']);
  });

  it('reports not rendered when the element has no content by the timeout', async () => {
    const element = mountElement();
    element.innerHTML = '<div></div>';
    watchRender(element, record, { quietMs, timeoutMs });

    await vi.advanceTimersByTimeAsync(timeoutMs);
    expect(outcomes).toEqual(['not-rendered']);
  });

  it('reports rendered at the timeout when content keeps changing', async () => {
    const element = mountElement();
    element.innerHTML = '<p>0</p>';
    watchRender(element, record, { quietMs, timeoutMs });

    for (let elapsed = 0; elapsed < timeoutMs; elapsed += quietMs / 2) {
      (element.querySelector('p') as HTMLElement).textContent = String(elapsed);
      await flushMutations();
      await vi.advanceTimersByTimeAsync(quietMs / 2);
    }
    expect(outcomes).toEqual(['rendered']);
  });

  it('reports nothing once stopped', async () => {
    const element = mountElement();
    const stop = watchRender(element, record, { quietMs, timeoutMs });
    stop();

    element.innerHTML = '<p>Choose one</p>';
    await vi.advanceTimersByTimeAsync(timeoutMs);
    expect(outcomes).toEqual([]);
  });
});
