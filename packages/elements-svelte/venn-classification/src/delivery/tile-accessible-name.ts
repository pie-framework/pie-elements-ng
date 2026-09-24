import { t } from '../i18n.js';
import type { VennTile } from '../types.js';

export function stripHtml(s: string): string {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accessible name for a tile (button aria-label, live-region announcements). */
export function tileAccessibleName(
  tile: Pick<VennTile, 'label' | 'imageUrl' | 'imageAlt'>,
  language?: string
): string {
  const alt = (tile.imageAlt ?? '').trim();
  if ((tile.imageUrl ?? '').trim() && alt) return alt;
  return stripHtml(tile.label ?? '') || t('tileFallbackName', language);
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
  verdict?: TileVerdict | null,
  language?: string
): string {
  const parts = [
    tileAccessibleName(tile, language),
    regionLabel === null
      ? t('tileNotPlaced', language)
      : t('tileInRegion', language, { region: regionLabel }),
  ];
  if (verdict === 'correct') parts.push(t('tileCorrect', language));
  if (verdict === 'incorrect') parts.push(t('tileIncorrect', language));
  return parts.join(', ');
}
