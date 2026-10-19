/**
 * BCP-47 language tag comparison, ported from pie-players
 * (`players-shared/src/i18n/language-tags.ts`) so both repositories resolve a tag the same way.
 *
 * Content producers disagree on syntax: the authoring surface offers POSIX `es_ES`, the
 * Learnosity transform emits POSIX, QTI carries BCP-47 `xml:lang`. Comparison runs on the
 * normalized form; rendering uses `toLanguageTag`.
 */

/**
 * Canonical comparison key: POSIX underscores become hyphens, a POSIX charset or modifier
 * suffix (`es_ES.UTF-8`, `es_ES@euro`) is stripped, and the result is lowercased. Empty for
 * nullish or blank input, which callers read as "declares no language".
 */
export function normalizeLanguageTag(tag: string | null | undefined): string {
  if (!tag) return '';
  const separatorsUnified = tag.trim().replace(/_/g, '-');
  const withoutPosixSuffix = separatorsUnified.split(/[.@]/)[0];
  return withoutPosixSuffix.toLowerCase();
}

/**
 * A tag in BCP-47 syntax with its authored casing kept, so `es_ES` renders as `es-ES`: the
 * form for a `lang` attribute or an `Intl` API. Empty for nullish or blank input.
 */
export function toLanguageTag(tag: string | null | undefined): string {
  return tag ? tag.trim().replace(/_/g, '-') : '';
}

/** Whether two tags denote the same locale, ignoring separator style and case. */
export function languageTagsEqual(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  const left = normalizeLanguageTag(a);
  if (!left) return false;
  return left === normalizeLanguageTag(b);
}

/**
 * The RFC 4647 lookup sequence for a tag, most specific first: `es-MX` yields
 * `["es-mx", "es"]`. Truncation never stops on a singleton subtag (RFC 4647 §3.4).
 */
export function languageTagLookupSequence(tag: string | null | undefined): string[] {
  const normalized = normalizeLanguageTag(tag);
  if (!normalized) return [];

  const subtags = normalized.split('-');
  const sequence: string[] = [];

  for (let length = subtags.length; length > 0; length--) {
    const candidate = subtags.slice(0, length);
    // A trailing singleton introduces an extension with nothing left in it.
    if (candidate.length > 1 && candidate[candidate.length - 1].length === 1) {
      continue;
    }
    sequence.push(candidate.join('-'));
  }

  return sequence;
}

/**
 * Best available tag for a request by RFC 4647 lookup, or `undefined`. Ranked by the
 * request's specificity, so `es-MX` prefers an `es-MX` candidate over an `es` one.
 */
export function findBestLanguageMatch(
  requested: string | null | undefined,
  available: readonly (string | null | undefined)[]
): string | undefined {
  for (const step of languageTagLookupSequence(requested)) {
    const hit = available.find((candidate) => normalizeLanguageTag(candidate) === step);
    if (hit != null) return hit;
  }
  return undefined;
}
