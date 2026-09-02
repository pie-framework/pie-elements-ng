import { describe, it, expect } from 'vitest';
import { KeyboardCode } from '@dnd-kit/core';
import { closestDroppableKeyboardCoordinates } from '../keyboard-coordinates';

function rectsToContext(rects: Record<string, any>) {
  const droppableRects = new Map(Object.entries(rects));
  const droppableContainers = new Map(Object.keys(rects).map((id) => [id, { disabled: false }]));

  return { droppableRects, droppableContainers };
}

function makeEvent(code: string, shiftKey = false) {
  return { code, preventDefault: () => {}, shiftKey };
}

// Mirrors dnd-kit's own KeyboardSensor, which derives collisionRect's top-left from the
// dragged item's current on-screen position on EVERY keydown — so a test simulating more
// than one press must rebuild collisionRect from currentCoordinates each time rather than
// holding it fixed.
function press(rects: Record<string, any>, currentCoordinates: any, itemSize: any, event: any) {
  const context = {
    ...rectsToContext(rects),
    collisionRect: { left: currentCoordinates.x, top: currentCoordinates.y, ...itemSize },
  };

  return closestDroppableKeyboardCoordinates(event, { context, currentCoordinates });
}

// A 2x2 category grid with the choices pool below it — the default `choicesPosition`.
const catA = { left: 0, top: 100, width: 200, height: 80, right: 200, bottom: 180 };
const catB = { left: 220, top: 100, width: 200, height: 80, right: 420, bottom: 180 };
const catC = { left: 0, top: 200, width: 200, height: 80, right: 200, bottom: 280 };
const catD = { left: 220, top: 200, width: 200, height: 80, right: 420, bottom: 280 };
const board = { left: 0, top: 320, width: 420, height: 120, right: 420, bottom: 440 };
const gridRects = {
  'cat-a': catA,
  'cat-b': catB,
  'cat-c': catC,
  'cat-d': catD,
  'choices-board': board,
};
const itemSize = { width: 100, height: 40 };

const dropPositionOf = (rect: any) => ({ x: rect.left, y: rect.top + rect.height / 2 });

describe('closestDroppableKeyboardCoordinates', () => {
  describe('arrow keys', () => {
    it("nudges the dragged item by dnd-kit's own default step (25px), unchanged", () => {
      const context = { ...rectsToContext({}), collisionRect: { left: 0, top: 0, width: 100, height: 40 } };
      const currentCoordinates = { x: 10, y: 20 };

      expect(
        closestDroppableKeyboardCoordinates(makeEvent(KeyboardCode.Down), { context, currentCoordinates }),
      ).toEqual({ x: 10, y: 45 });
      expect(
        closestDroppableKeyboardCoordinates(makeEvent(KeyboardCode.Up), { context, currentCoordinates }),
      ).toEqual({ x: 10, y: -5 });
      expect(
        closestDroppableKeyboardCoordinates(makeEvent(KeyboardCode.Right), { context, currentCoordinates }),
      ).toEqual({ x: 35, y: 20 });
      expect(
        closestDroppableKeyboardCoordinates(makeEvent(KeyboardCode.Left), { context, currentCoordinates }),
      ).toEqual({ x: -15, y: 20 });
    });
  });

  describe('other keys', () => {
    it('returns undefined so dnd-kit keeps its own handling', () => {
      const context = { ...rectsToContext(gridRects), collisionRect: { left: 0, top: 0, ...itemSize } };

      expect(
        closestDroppableKeyboardCoordinates(makeEvent('KeyQ'), { context, currentCoordinates: { x: 0, y: 0 } }),
      ).toBeUndefined();
    });
  });

  describe('Tab / Shift+Tab', () => {
    it('cycles categories in reading order (top-to-bottom, then left-to-right), then the board, then wraps', () => {
      // Start inside the board, as if a pool choice was just picked up.
      let coords = { x: board.left + 10, y: board.top + 10 };
      const visited = [];

      for (let i = 0; i < 5; i++) {
        coords = press(gridRects, coords, itemSize, makeEvent('Tab'));
        visited.push(coords);
      }

      expect(visited).toEqual([
        dropPositionOf(catA),
        dropPositionOf(catB),
        dropPositionOf(catC),
        dropPositionOf(catD),
        dropPositionOf(board),
      ]);
    });

    it('cycles backwards with Shift+Tab', () => {
      // Sitting on category A (first in the cycle) — reverse wraps to the board (last).
      const fromA = press(gridRects, dropPositionOf(catA), itemSize, makeEvent('Tab', true));
      expect(fromA).toEqual(dropPositionOf(board));

      // From the board, reverse goes to the last category.
      const fromBoard = press(gridRects, dropPositionOf(board), itemSize, makeEvent('Tab', true));
      expect(fromBoard).toEqual(dropPositionOf(catD));
    });

    it('resolves the source category by containment when a choice is picked up from inside it', () => {
      // The dragged choice still sits inside category C's rect; Tab must advance to D,
      // not re-resolve to some other target.
      const insideC = { x: catC.left + 20, y: catC.top + 20 };

      expect(press(gridRects, insideC, itemSize, makeEvent('Tab'))).toEqual(dropPositionOf(catD));
    });

    it('keeps the choices board as a fixed last stop instead of sorting it by its own center', () => {
      // Regression case for a bug that shipped in drag-in-the-blank: with the pool beside
      // the categories (`choicesPosition: 'left'`/`'right'`), the board is a tall
      // container whose own center falls numerically BETWEEN two category rows. Sorting it
      // by position interleaves it mid-cycle, so one Tab press skips categories.
      const tallBoard = { left: 500, top: 95, width: 120, height: 190, right: 620, bottom: 285 };
      const rects = { 'cat-a': catA, 'cat-b': catB, 'cat-c': catC, 'cat-d': catD, 'choices-board': tallBoard };

      // tallBoard's center y is 190 — between catB's row (140) and catC's row (240).
      let coords = { x: tallBoard.left + 10, y: tallBoard.top + 10 };
      const visited = [];

      for (let i = 0; i < 5; i++) {
        coords = press(rects, coords, itemSize, makeEvent('Tab'));
        visited.push(coords);
      }

      expect(visited).toEqual([
        dropPositionOf(catA),
        dropPositionOf(catB),
        dropPositionOf(catC),
        dropPositionOf(catD),
        dropPositionOf(tallBoard),
      ]);
    });

    it('skips disabled droppables', () => {
      const context = {
        droppableRects: new Map(Object.entries(gridRects)),
        droppableContainers: new Map([
          ['cat-a', { disabled: false }],
          ['cat-b', { disabled: true }],
          ['cat-c', { disabled: false }],
          ['cat-d', { disabled: false }],
          ['choices-board', { disabled: false }],
        ]),
        collisionRect: { left: catA.left, top: catA.top + catA.height / 2, ...itemSize },
      };

      const next = closestDroppableKeyboardCoordinates(makeEvent('Tab'), {
        context,
        currentCoordinates: dropPositionOf(catA),
      });

      expect(next).toEqual(dropPositionOf(catC));
    });

    it('returns the current coordinates unchanged when there is nothing to cycle to', () => {
      const context = { ...rectsToContext({}), collisionRect: { left: 0, top: 0, ...itemSize } };
      const currentCoordinates = { x: 7, y: 9 };

      expect(closestDroppableKeyboardCoordinates(makeEvent('Tab'), { context, currentCoordinates })).toEqual(
        currentCoordinates,
      );
    });
  });
});
