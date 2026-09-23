import type { VennTile } from '../types.js';

export function stripHtml(s: string): string {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accessible name for a tile (button aria-label, live-region announcements). */
export function tileAccessibleName(
  tile: Pick<VennTile, 'label' | 'imageUrl' | 'imageAlt'>
): string {
  const alt = (tile.imageAlt ?? '').trim();
  if ((tile.imageUrl ?? '').trim() && alt) return alt;
  const t = stripHtml(tile.label ?? '');
  return t || 'Tile';
}

export type TileVerdict = 'correct' | 'incorrect' | 'unanswered';

/**
 * A tile button's accessible name: what it is, where it sits, and in `evaluate`
 * mode whether that is right - "Crocodile, in Reptile and Egg-layer, incorrect".
 * The placed tiles render in a layer apart from the region anchors, and the
 * verdict badge is an `aria-hidden` icon, so the name is where assistive
 * technology learns both.
 *
 * `regionLabel` is `null` for a tile in the tray. An unplaced tile's verdict is
 * `unanswered`, which "not placed" already says.
 */
export function tileStatusName(
  tile: Pick<VennTile, 'label' | 'imageUrl' | 'imageAlt'>,
  regionLabel: string | null,
  verdict?: TileVerdict | null
): string {
  const parts = [
    tileAccessibleName(tile),
    regionLabel === null ? 'not placed' : `in ${regionLabel}`,
  ];
  if (verdict === 'correct' || verdict === 'incorrect') parts.push(verdict);
  return parts.join(', ');
}
