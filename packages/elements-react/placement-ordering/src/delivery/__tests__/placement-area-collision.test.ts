import { describe, expect, it } from 'vitest';
import { rectIntersection } from '@dnd-kit/core';
import type { ClientRect, CollisionDetection } from '@dnd-kit/core';

import { placementAreaCollision } from '../placement-area-collision';

type CollisionArgs = Parameters<CollisionDetection>[0];

const rect = (left: number, top: number, width: number, height: number): ClientRect => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
});

const moved = (r: ClientRect, x: number, y: number) => rect(r.left + x, r.top + y, r.width, r.height);

// A vertical item with three choices: the source column at x 0-100, the response areas at x 120-220,
// each row 50 high with a 10 gap.
const row = (i: number) => i * 60;
const sourceSlot = (i: number) => rect(0, row(i), 100, 50);
const targetSlot = (i: number) => rect(120, row(i), 100, 50);

const tileData = (type: 'choice' | 'target', id: string, index: number) => ({ type, id, index });

// What tile.tsx registers: one droppable per tile, its data the tile's own.
const container = (dropId: string, data: ReturnType<typeof tileData>) =>
  ({ id: dropId, data: { current: data } }) as unknown as CollisionArgs['droppableContainers'][number];

const sourceDrop = (i: number) => `drop-choice-c${i + 1}-${i}`;
const targetDrop = (i: number) => `drop-target-${i}`;

const droppables = (skip: string[] = []) => {
  const entries = [0, 1, 2].flatMap((i) => [
    { id: sourceDrop(i), rect: sourceSlot(i), data: tileData('choice', `c${i + 1}`, i) },
    { id: targetDrop(i), rect: targetSlot(i), data: tileData('target', `c${i + 1}`, i) },
  ]);
  const live = entries.filter(({ id }) => !skip.includes(id));

  return {
    droppableContainers: live.map(({ id, data }) => container(id, data)),
    droppableRects: new Map(live.map(({ id, rect: r }) => [id, r])) as CollisionArgs['droppableRects'],
  };
};

const detect = (
  active: { type: 'choice' | 'target'; id: string; index: number },
  start: ClientRect,
  travel: { x: number; y: number },
) => {
  // The dragged tile's own droppable is disabled for the drag, so dnd-kit never passes it.
  const own = active.type === 'choice' ? sourceDrop(active.index) : targetDrop(active.index);
  const args = {
    active: { id: 'drag', data: { current: active } },
    collisionRect: moved(start, travel.x, travel.y),
    pointerCoordinates: null,
    ...droppables([own]),
  } as unknown as CollisionArgs;

  return placementAreaCollision(args).map(({ id }) => id);
};

describe('placementAreaCollision', () => {
  describe('a drag from the source column', () => {
    const c1 = { type: 'choice' as const, id: 'c1', index: 0 };

    it('is received by the response area it overlaps, not the source slot it overlaps more', () => {
      // 30 right and down to row 1: 70x50 over the source slot of c2, 10x50 over the response area.
      expect(detect(c1, sourceSlot(0), { x: 30, y: 60 })).toEqual([targetDrop(1)]);
    });

    it('is received by a response area it overlaps by a sliver', () => {
      expect(detect(c1, sourceSlot(0), { x: 21, y: 0 })).toEqual([targetDrop(0)]);
    });

    it('is received by nothing while it only overlaps source slots', () => {
      expect(detect(c1, sourceSlot(0), { x: 0, y: 60 })).toEqual([]);
    });

    it('picks the response area with the most overlap among those it overlaps', () => {
      // 35 down: 15 high over response area 0, 25 over response area 1.
      expect(detect(c1, sourceSlot(0), { x: 60, y: 35 })).toEqual([targetDrop(1), targetDrop(0)]);
    });
  });

  describe('a drag from a response area', () => {
    const c1 = { type: 'target' as const, id: 'c1', index: 0 };

    it('is received by its own source slot when it overlaps that more than a response area', () => {
      // 60 left and 20 down: 40x30 over its own source slot, 40x10 over the response area below.
      expect(detect(c1, targetSlot(0), { x: -60, y: 20 })).toEqual([sourceDrop(0), targetDrop(1)]);
    });

    it('is received by a response area when it overlaps that more than its own source slot', () => {
      // 30 left and 40 down: 70x30 over the response area below, 10x10 over its own source slot.
      expect(detect(c1, targetSlot(0), { x: -30, y: 40 })).toEqual([targetDrop(1), sourceDrop(0)]);
    });

    it('is received by its own source slot when it overlaps no response area', () => {
      expect(detect(c1, targetSlot(0), { x: -100, y: 0 })).toEqual([sourceDrop(0)]);
    });

    it('is not received by the source slot of another choice', () => {
      // From row 1, over the source slots of c1 and c2 equally; c2's own is the only one it can return to.
      const c2 = { type: 'target' as const, id: 'c2', index: 1 };

      expect(detect(c2, targetSlot(1), { x: -120, y: -30 })).toEqual([sourceDrop(1)]);
    });
  });

  describe('without response areas', () => {
    it('detects as rectIntersection does, for the source slots to reorder over', () => {
      const container0 = container(sourceDrop(0), tileData('choice', 'c1', 0));
      const container1 = container(sourceDrop(1), tileData('choice', 'c2', 1));
      const args = {
        active: { id: 'drag', data: { current: tileData('choice', 'c3', 2) } },
        collisionRect: moved(sourceSlot(2), 0, -40),
        pointerCoordinates: null,
        droppableContainers: [container0, container1],
        droppableRects: new Map([
          [sourceDrop(0), sourceSlot(0)],
          [sourceDrop(1), sourceSlot(1)],
        ]),
      } as unknown as CollisionArgs;

      expect(placementAreaCollision(args)).toEqual(rectIntersection(args));
      expect(placementAreaCollision(args).length).toBeGreaterThan(0);
    });
  });
});
