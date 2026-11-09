import { catalogs } from '../i18n/index.js';
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
  return stripHtml(tile.label ?? '') || catalogs.forLocale(language).t('tileFallbackName');
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
  const i18n = catalogs.forLocale(language);
  const parts = [
    tileAccessibleName(tile, language),
    regionLabel === null
      ? i18n.t('tileNotPlaced')
      : i18n.t('tileInRegion', { region: regionLabel }),
  ];
  if (verdict === 'correct') parts.push(i18n.t('tileCorrect'));
  if (verdict === 'incorrect') parts.push(i18n.t('tileIncorrect'));
  return parts.join(i18n.t('listSeparator'));
}
