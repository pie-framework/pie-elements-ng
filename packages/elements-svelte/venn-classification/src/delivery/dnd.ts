/**
 * Pure helpers for the pointer + keyboard placement flow.
 *
 * The Svelte component owns pointer/keyboard event wiring (so it can drive
 * reactive state), but the *session transformation* of a drop is done here so
 * it can be tested in isolation and stays identical between pointer and
 * keyboard paths.
 */

import type { Region, VennModel, VennSession, VennTile } from '../types.js';
import {
  isComplete,
  normalizeRegion,
  normalizeSession,
  regionsEqual,
} from '../controller/index.js';

export type PlacementValue = Region | null;

export interface ApplyPlacementArgs {
  model: VennModel;
  session: VennSession | null | undefined;
  tileId: string;
  /** `null` means "return to tray", otherwise the region to drop into. */
  placement: PlacementValue;
}

/**
 * Build the next session after a single placement.
 *
 * Keeps the update atomic: one new object, one new `placements` map. The
 * session reference strictly changes so host players that compare by identity
 * detect the update; callers that compare by value still observe the single
 * field change.
 *
 * `placements` comes back with a key for every authored tile (`null` = tray),
 * as the PRD requires. The keys are seeded here, on the learner's first
 * placement, and never on `set session`: a player counts a session carrying
 * content as a response.
 */
export function applyPlacement({
  model,
  session,
  tileId,
  placement,
}: ApplyPlacementArgs): VennSession {
  const base = normalizeSession(session, model);
  const nextSession: VennSession = {
    ...base,
    placements: {
      ...base.placements,
      [tileId]: placement === null ? null : normalizeRegion(placement),
    },
  };
  nextSession.completed = isComplete(model, nextSession);
  return nextSession;
}

/** The tile's current placement: `null` when it is in the tray or has no key. */
export function currentPlacement(
  session: VennSession | null | undefined,
  tileId: string
): PlacementValue {
  const p = session?.placements?.[tileId];
  return Array.isArray(p) ? normalizeRegion(p) : null;
}

/** True when dropping `tileId` at `placement` would leave the session as it is. */
export function isSamePlacement(
  session: VennSession | null | undefined,
  tileId: string,
  placement: PlacementValue
): boolean {
  const current = currentPlacement(session, tileId);
  if (current === null || placement === null) return current === placement;
  return regionsEqual(current, placement);
}

/**
 * Compute the list of unplaced tile ids (in `model.tiles` order).
 */
export function unplacedTiles(
  model: VennModel,
  session: VennSession | null | undefined
): VennTile[] {
  const placements = session?.placements ?? {};
  return (model.tiles || []).filter((tile) => {
    const p = placements[tile.id];
    return p === null || p === undefined;
  });
}

/**
 * Group placed tiles by their region key, in `model.tiles` order. Unplaced
 * tiles are omitted. Used by the delivery component to drive slot-position
 * indices within a region.
 */
export function groupTilesByRegion(
  model: VennModel,
  session: VennSession | null | undefined
): Record<string, VennTile[]> {
  const placements = session?.placements ?? {};
  const groups: Record<string, VennTile[]> = {};
  for (const tile of model.tiles || []) {
    const p = placements[tile.id];
    if (p === null || p === undefined) continue;
    const key = normalizeRegion(p).join(',');
    if (!groups[key]) groups[key] = [];
    groups[key].push(tile);
  }
  return groups;
}
