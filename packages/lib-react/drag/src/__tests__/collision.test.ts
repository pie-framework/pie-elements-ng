import { describe, expect, it } from 'vitest';
import { rectIntersection } from '@dnd-kit/core';
import type { ClientRect, CollisionDetection, Modifier } from '@dnd-kit/core';

import { createDragCollision } from '../collision';
import type { DragCollision, PointerCoordinates } from '../collision';

type CollisionArgs = Parameters<CollisionDetection>[0];
type ModifierArgs = Parameters<Modifier>[0];

const rect = (left: number, top: number, width: number, height: number): ClientRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const moved = (r: ClientRect, x: number, y: number) => rect(r.left + x, r.top + y, r.width, r.height);

// A region that scrolls sideways, as categorize's does: two categories over a pool, and a third
// category scrolled out of view to the right.
const region = rect(0, 100, 600, 300);
const targets = {
  left: rect(0, 100, 300, 100),
  right: rect(300, 100, 300, 100),
  pool: rect(0, 300, 600, 100),
  scrolledOut: rect(600, 100, 300, 100),
};
const droppableRects: CollisionArgs['droppableRects'] = new Map(Object.entries(targets));
const droppableContainers = Object.keys(targets).map((id) => ({
  id,
})) as unknown as CollisionArgs['droppableContainers'];
const active = { id: 'choice' } as unknown as CollisionArgs['active'];

// A choice in the left category, picked up at its centre.
const tile = rect(20, 130, 100, 40);
const grab = { x: 70, y: 150 };

// Holds the tile inside the first scrollable ancestor, as restrictToFirstScrollableAncestor does.
const holdInRegion: Modifier = ({ transform, draggingNodeRect, scrollableAncestorRects }) => {
  const [bounds] = scrollableAncestorRects;
  if (!draggingNodeRect || !bounds) return transform;

  return {
    ...transform,
    x: Math.min(Math.max(transform.x, bounds.left - draggingNodeRect.left), bounds.right - draggingNodeRect.right),
    y: Math.min(Math.max(transform.y, bounds.top - draggingNodeRect.top), bounds.bottom - draggingNodeRect.bottom),
  };
};

const modifierArgs = (x: number, y: number): ModifierArgs => ({
  activatorEvent: null,
  active: null,
  activeNodeRect: tile,
  draggingNodeRect: tile,
  containerNodeRect: null,
  over: null,
  overlayNodeRect: tile,
  scrollableAncestors: [],
  scrollableAncestorRects: [region],
  transform: { x, y, scaleX: 1, scaleY: 1 },
  windowRect: null,
});

/**
 * One render of a drag that has moved the pointer by `travel`, as the provider runs it: the
 * modifiers, then collision detection on the tile where the modifiers put it.
 */
const render = (collision: DragCollision, travel: PointerCoordinates, { keyboard = false } = {}) => {
  const [modifier = holdInRegion] = collision.modifiers ?? [];
  const transform = modifier(modifierArgs(travel.x, travel.y));
  const args: CollisionArgs = {
    active,
    collisionRect: moved(tile, transform.x, transform.y),
    droppableRects,
    droppableContainers,
    pointerCoordinates: keyboard ? null : { x: grab.x + travel.x, y: grab.y + travel.y },
  };

  return { ids: collision.collisionDetection(args).map(({ id }) => id), args };
};

const ids = (collisions: ReturnType<CollisionDetection>) => collisions.map(({ id }) => id);

describe('createDragCollision', () => {
  describe('given modifiers', () => {
    it('leaves the tile where the modifiers put it', () => {
      const [modifier] = createDragCollision({ modifiers: [holdInRegion] }).modifiers ?? [];

      expect(modifier(modifierArgs(0, -200))).toEqual(holdInRegion(modifierArgs(0, -200)));
    });

    it('finds no target for a tile released above the region, where the held tile still overlaps one', () => {
      const { ids: found, args } = render(createDragCollision({ modifiers: [holdInRegion] }), { x: 0, y: -120 });

      expect(ids(rectIntersection(args))).toEqual(['left']);
      expect(found).toEqual([]);
    });

    it('finds no target for a tile released below or beside the region', () => {
      const collision = createDragCollision({ modifiers: [holdInRegion] });

      expect(render(collision, { x: 0, y: 330 }).ids).toEqual([]);
      expect(render(collision, { x: -150, y: 0 }).ids).toEqual([]);
    });

    it('finds the target a tile overlaps when released a few pixels outside it', () => {
      const collision = createDragCollision({ modifiers: [holdInRegion] });

      // the pointer 4px above the region, the tile's lower half over the right category
      expect(render(collision, { x: 330, y: -54 }).ids).toEqual(['right']);
      // the pointer 4px below the pool
      expect(render(collision, { x: 0, y: 254 }).ids).toEqual(['pool']);
    });

    it('finds what the base detection finds for a tile released inside the region', () => {
      const { ids: found, args } = render(createDragCollision({ modifiers: [holdInRegion] }), { x: 380, y: 0 });

      expect(found).toEqual(ids(rectIntersection(args)));
      expect(found).toEqual(['right']);
    });

    it('ignores the parts of targets outside the first scrollable ancestor', () => {
      // the pointer beside the region, over where the scrolled-out category sits
      expect(render(createDragCollision({ modifiers: [holdInRegion] }), { x: 640, y: 0 }).ids).toEqual([]);
    });

    it('collides where the modifiers put the tile for a keyboard drag', () => {
      const collision = createDragCollision({ modifiers: [holdInRegion] });
      const { ids: found, args } = render(collision, { x: 0, y: -120 }, { keyboard: true });

      expect(found).toEqual(ids(rectIntersection(args)));
      expect(found).toEqual(['left']);
    });

    it('runs the given detection', () => {
      const detect: CollisionDetection = ({ collisionRect }) => [{ id: `at ${collisionRect.top}` }];

      expect(render(createDragCollision({ detect, modifiers: [holdInRegion] }), { x: 0, y: -120 }).ids).toEqual([
        'at 10',
      ]);
    });
  });

  describe('without modifiers', () => {
    it('runs the base detection on the rect it is given', () => {
      const collision = createDragCollision();
      const { ids: found, args } = render(collision, { x: 0, y: -120 });

      expect(collision.modifiers).toBeUndefined();
      expect(found).toEqual(ids(rectIntersection(args)));
      expect(found).toEqual(['left']);
    });
  });

  describe('lastPointer', () => {
    it('is the pointer at the latest collision check, and null for a keyboard drag or after reset', () => {
      const collision = createDragCollision();
      expect(collision.lastPointer()).toBeNull();

      render(collision, { x: 10, y: 20 });
      render(collision, { x: 30, y: 40 });
      expect(collision.lastPointer()).toEqual({ x: 100, y: 190 });

      collision.reset();
      expect(collision.lastPointer()).toBeNull();

      render(collision, { x: 30, y: 40 });
      render(collision, { x: 0, y: 0 }, { keyboard: true });
      expect(collision.lastPointer()).toBeNull();
    });
  });

  it('keeps no state shared between instances', () => {
    const first = createDragCollision({ modifiers: [holdInRegion] });
    const second = createDragCollision({ modifiers: [holdInRegion] });

    // the first instance's modifiers hold its tile 90px down; the second's have not run
    render(first, { x: 0, y: -120 });
    expect(second.lastPointer()).toBeNull();

    const found = second.collisionDetection({
      active,
      collisionRect: moved(tile, 380, 0),
      droppableRects,
      droppableContainers,
      pointerCoordinates: { x: 450, y: 150 },
    });

    expect(ids(found)).toEqual(['right']);
    expect(second.lastPointer()).toEqual({ x: 450, y: 150 });
    expect(first.lastPointer()).toEqual({ x: 70, y: 30 });
  });
});
