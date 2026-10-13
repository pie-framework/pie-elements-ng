import { describe, it, expect, vi } from 'vitest';
import { closestDroppableKeyboardCoordinates } from '../keyboard-coordinates';

type Rect = { left: number; top: number; width: number; height: number; right: number; bottom: number };
type Point = { x: number; y: number };

const rectOf = (left: number, top: number, width: number, height: number): Rect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

// match-list at 320 CSS px: the interactive region shows x 16..304 and scrolls horizontally; the
// response areas start at x 336, outside it, with the choices pool below them.
const area0 = rectOf(336, 250, 208, 48);
const area1 = rectOf(336, 316, 208, 48);
const area2 = rectOf(336, 382, 208, 48);
const pool = rectOf(16, 470, 528, 86);
const rects: Record<string, Rect> = { 'drop-0': area0, 'drop-1': area1, 'drop-2': area2, 'choices-pool': pool };
// Where a response area is once the region has scrolled it into view.
const inView = (rect: Rect) => rectOf(96, rect.top, rect.width, rect.height);
const itemSize = { width: 208, height: 54 };
// A pool choice that was just picked up.
const inPool = { x: 72, y: 486 };

// Mirrors keyboard-coordinates.ts's own dropPosition math: land on the target's left edge, with the
// dragged item vertically centred on the target.
const dropPositionOf = (rect: Rect): Point => ({ x: rect.left, y: rect.top + rect.height / 2 - itemSize.height / 2 });

type FakeNode = { getBoundingClientRect: () => Rect; scrollIntoView?: (options?: unknown) => void };

/** A droppable's DOM node, whose rect becomes `scrolledRect` once it is scrolled into view. */
function fakeNode(rect: Rect, scrolledRect: Rect = rect): FakeNode {
  let current = rect;

  return {
    getBoundingClientRect: () => current,
    scrollIntoView: vi.fn(() => {
      current = scrolledRect;
    }),
  };
}

function containersOf(nodes: Record<string, FakeNode | undefined>) {
  return new Map(Object.entries(nodes).map(([id, node]) => [id, { disabled: false, node: { current: node } }]));
}

function press(nodes: Record<string, FakeNode | undefined>, from: Point, shiftKey = false) {
  const context = {
    droppableRects: new Map(Object.entries(rects)),
    droppableContainers: containersOf(nodes),
    collisionRect: { left: from.x, top: from.y, ...itemSize },
  };

  return closestDroppableKeyboardCoordinates(
    { code: 'Tab', preventDefault: () => {}, shiftKey },
    { active: { data: { current: { type: 'choice', id: 0 } } }, context, currentCoordinates: from },
  );
}

describe('closestDroppableKeyboardCoordinates', () => {
  describe('Tab / Shift+Tab in a horizontally scrolled region', () => {
    it('scrolls the next response area into view and lands on where it then is', () => {
      const nodes = {
        'drop-0': fakeNode(area0, inView(area0)),
        'drop-1': fakeNode(area1, inView(area1)),
        'drop-2': fakeNode(area2, inView(area2)),
        'choices-pool': fakeNode(pool),
      };

      expect(press(nodes, inPool)).toEqual(dropPositionOf(inView(area0)));
      expect(nodes['drop-0'].scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant',
      });
      expect(nodes['drop-1'].scrollIntoView).not.toHaveBeenCalled();
      expect(nodes['drop-2'].scrollIntoView).not.toHaveBeenCalled();
      expect(nodes['choices-pool'].scrollIntoView).not.toHaveBeenCalled();
    });

    it('scrolls the previous response area into view with Shift+Tab', () => {
      const nodes = {
        'drop-0': fakeNode(area0, inView(area0)),
        'drop-1': fakeNode(area1, inView(area1)),
        'drop-2': fakeNode(area2, inView(area2)),
        'choices-pool': fakeNode(pool),
      };

      expect(press(nodes, inPool, true)).toEqual(dropPositionOf(inView(area2)));
      expect(nodes['drop-2'].scrollIntoView).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
        behavior: 'instant',
      });
      expect(nodes['drop-0'].scrollIntoView).not.toHaveBeenCalled();
    });

    it('lands on the measured rect when the target node cannot scroll', () => {
      const nodes = {
        'drop-0': { getBoundingClientRect: () => area0 },
        'drop-1': fakeNode(area1),
        'drop-2': fakeNode(area2),
        'choices-pool': fakeNode(pool),
      };

      expect(press(nodes, inPool)).toEqual(dropPositionOf(area0));
    });

    it("lands on dnd-kit's cached rect when the target has no node", () => {
      const nodes = {
        'drop-0': undefined,
        'drop-1': fakeNode(area1),
        'drop-2': fakeNode(area2),
        'choices-pool': fakeNode(pool),
      };

      expect(press(nodes, inPool)).toEqual(dropPositionOf(area0));
    });
  });
});
