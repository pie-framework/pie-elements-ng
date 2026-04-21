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
