import type { MediaSource } from '@pie-element/shared-types';

/**
 * URL safety and source normalization for authored media.
 *
 * A copy of `isSafeMediaSrc` and `normalizeMediaSources` from the `media` module
 * of pie-players' players-shared package. Elements must run under any host, so
 * they take no dependency on a player package; parity is held by the tests in
 * `tests/media-sources.test.ts`, the same way `@pie-element/shared-types`
 * mirrors the player-side `MediaAssetRef`. A rule change belongs in both copies.
 */

/**
 * Media source URLs are handed to a media element in the learner's browser. Only
 * schemes such an element can actually fetch are allowed; anything else is
 * dropped so an authored `javascript:` / `file:` URL cannot ride into the DOM.
 * Relative and protocol-relative URLs are allowed — host content is commonly
 * served from the same origin as the player.
 */
const DISALLOWED_SRC_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const ALLOWED_SRC_SCHEMES = new Set(['http:', 'https:', 'data:', 'blob:']);

export function isSafeMediaSrc(raw: unknown): raw is string {
  if (typeof raw !== 'string') return false;
  const src = raw.trim();
  if (!src) return false;
  // Relative ("/video.mp4", "video.mp4") and protocol-relative ("//cdn/x.mp4")
  // forms carry no scheme to check and inherit the document's.
  if (src.startsWith('//') || !DISALLOWED_SRC_SCHEME.test(src)) return true;
  const scheme = src.slice(0, src.indexOf(':') + 1).toLowerCase();
  return ALLOWED_SRC_SCHEMES.has(scheme);
}

export function normalizeMediaSources(raw: unknown): MediaSource[] {
  if (!Array.isArray(raw)) return [];
  const sources: MediaSource[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as Partial<MediaSource>;
    if (!isSafeMediaSrc(candidate.src)) continue;
    const source: MediaSource = { src: candidate.src.trim() };
    if (typeof candidate.type === 'string' && candidate.type.trim()) {
      source.type = candidate.type.trim();
    }
    if (Number.isFinite(candidate.width)) source.width = candidate.width;
    if (Number.isFinite(candidate.height)) source.height = candidate.height;
    // Deduplicated by `src`, because the delivery renders `<source>` elements in
    // an `{#each}` keyed on exactly that: an authored list naming one URL twice —
    // the same file under two MIME types is the plausible way — would otherwise
    // throw Svelte's duplicate-key error rather than degrade. The first entry
    // wins, so authored order still decides which encoding the browser is offered
    // first.
    if (sources.some((existing) => existing.src === source.src)) continue;
    sources.push(source);
  }
  return sources;
}
