import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

// MathJax loads off a CDN and has no bearing on the announcements.
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: DragInTheBlank } = await import('../drag-in-the-blank');

const props = {
  markup: 'One {{0}} two {{1}}',
  choices: [
    { id: 'a', value: 'alpha' },
    { id: 'b', value: 'beta' },
  ],
  language: 'en-US',
};

const SELECTED_ALPHA = 'Selected answer choice alpha. Use TAB to choose a blank.';
const ALPHA_NOT_SELECTED = 'Answer choice alpha is no longer selected. Use TAB to select an answer choice.';

/**
 * What a screen reader is handed, in order: the text of a live region each time that text changes, and
 * nothing when a region is emptied. A text that is already in a region and is written there again
 * changes nothing in the page, so it is not said again.
 *
 * React writes a message into a region as a text node and later rewrites that node's text, all between
 * two reads here, so each change is rebuilt from the observer's records: a text change carries the text
 * it replaced, which is what the node said after the change before it.
 */
const listenToLiveRegions = () => {
  const observer = new MutationObserver(() => {});
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, characterDataOldValue: true });
  // The region each text node was written into: a node that has been emptied since is no longer in it.
  const regionOf = new WeakMap<Node, Element | null>();

  return () => {
    const records = observer.takeRecords();
    const textAfter = (index: number, node: Node) => {
      const next = records.slice(index + 1).find((r) => r.type === 'characterData' && r.target === node);

      return next ? (next.oldValue ?? '') : (node.textContent ?? '');
    };
    const said: string[] = [];

    records.forEach((record, index) => {
      if (record.type === 'childList') {
        const region = (record.target as Element).closest?.('[aria-live]') ?? null;

        for (const node of record.addedNodes) {
          regionOf.set(node, region);
          const text = node.nodeType === Node.TEXT_NODE ? textAfter(index, node) : (node.textContent ?? '');

          if (region && text) said.push(text);
        }

        return;
      }

      if (record.type === 'characterData') {
        const region = regionOf.get(record.target) ?? record.target.parentElement?.closest('[aria-live]');
        const text = textAfter(index, record.target);

        if (region && text) said.push(text);
      }
    });

    return said;
  };
};

// happy-dom lays nothing out, so every box is empty and a keyboard drag finds no blank to move to. Each
// blank gets a box in a line of text, each choice tile a chip's box, and the pool, with what holds it,
// the area below the text. dnd-kit's drag overlay (fixed in place) starts where the choice was lifted
// from, which a keyboard drag leaves focused: a choice lifted from a blank is first over that blank.
const box = (left: number, top: number, width: number, height: number) =>
  ({ x: left, y: top, left, top, width, height, right: left + width, bottom: top + height, toJSON: () => ({}) }) as DOMRect;
const blankBoxes: Record<string, DOMRect> = { 'Blank 1': box(100, 0, 60, 24), 'Blank 2': box(300, 0, 60, 24) };
const poolBox = box(0, 200, 600, 300);
const tileBox = box(10, 210, 90, 32);
const OVERLAY = '[style*="position: fixed"]';

const boxOf = (node: Element): DOMRect => {
  const lifted = document.activeElement;

  if (node.closest(OVERLAY) && lifted && lifted !== document.body && !lifted.closest(OVERLAY)) return boxOf(lifted);

  const blank = node.closest('[aria-label^="Blank "]')?.getAttribute('aria-label') ?? '';
  const named = Object.keys(blankBoxes).find((name) => blank.startsWith(name));

  if (named) return blankBoxes[named];
  if (node.closest('[aria-label^="Answer choice:"]')) return tileBox;

  return node.matches('.board') || node.querySelector('.board') ? poolBox : tileBox;
};

describe('DragInTheBlank keyboard drag announcements', () => {
  beforeEach(() => {
    // Date as well: a click within 250ms of a drag ending is the drag's own, and ignored.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      return boxOf(this);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const tick = (ms: number) =>
    act(() => {
      vi.advanceTimersByTime(ms);
    });

  // dnd-kit listens on the document once a drag is live, and only from the tick after it starts.
  const press = (code: string, key = code) => {
    act(() => {
      fireEvent.keyDown(document.activeElement as HTMLElement, { code, key });
    });
    tick(10);
  };

  // The session follows each placement, as the element's host makes it do.
  function Item() {
    const [value, setValue] = React.useState({});

    return <DragInTheBlank {...props} value={value} onChange={setValue} />;
  }

  const setup = () => {
    const view = render(<Item />);
    const said = listenToLiveRegions();
    // A choice tile in the pool, not the drag overlay's copy of it.
    const poolTile = (name: string) =>
      view.container.querySelector(`.board [aria-label="Answer choice: ${name}"]`) as HTMLElement;

    return { said, poolTile };
  };

  it('says the selection each time the same choice is selected, also after the selection it ends', () => {
    const { said, poolTile } = setup();
    const heard: string[][] = [];

    for (const step of ['select', 'deselect', 'select again', 'deselect again', 'select a third time']) {
      poolTile('alpha').focus();
      press('Enter');
      tick(400);
      heard.push(said());
      expect(heard.at(-1), step).toHaveLength(1);
    }

    expect(heard).toEqual([[SELECTED_ALPHA], [ALPHA_NOT_SELECTED], [SELECTED_ALPHA], [ALPHA_NOT_SELECTED], [SELECTED_ALPHA]]);
  });

  it('says the selection again after a click placed the choice a keyboard drag held', () => {
    const { said, poolTile } = setup();

    poolTile('alpha').focus();
    press('Enter');
    tick(400);
    expect(said()).toEqual([SELECTED_ALPHA]);

    // The click ends the keyboard drag itself; the placement says what it did.
    fireEvent.click(screen.getByRole('button', { name: 'Blank 1 is empty' }));
    tick(400);
    expect(said()).toEqual([expect.stringMatching(/^Placed answer choice alpha in blank 1\./)]);

    screen.getByRole('button', { name: 'Answer choice: alpha in blank 1' }).focus();
    press('Enter');
    tick(400);
    expect(said()).toEqual([SELECTED_ALPHA]);
  });

  it('keeps the selection said when the drag first reports the pool it was lifted from, and reads the pool when Tab reaches it', () => {
    const { said, poolTile } = setup();

    poolTile('alpha').focus();
    press('Enter');
    // dnd-kit reports where the choice is over a few milliseconds after the drag starts.
    tick(400);
    expect(said()).toEqual([SELECTED_ALPHA]);

    press('Tab');
    tick(400);
    expect(said()).toEqual([
      'Selected blank 1. Press ENTER to move selected answer choice alpha here or TAB to move to a different blank.',
    ]);

    press('Tab');
    tick(400);
    press('Tab');
    tick(400);
    expect(said()).toEqual([
      'Selected blank 2. Press ENTER to move selected answer choice alpha here or TAB to move to a different blank.',
      'Press ENTER to leave selected answer choice unplaced or TAB to move to a blank. Selected answer choice: alpha',
    ]);

    press('Escape');
    tick(400);
    expect(said()).toEqual([ALPHA_NOT_SELECTED]);
  });
});
