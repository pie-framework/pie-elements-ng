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

/** `maximize()` runs on every resolution, for each candidate catalog. */
const scripts = new Map<string, string | undefined>();

/**
 * The script a tag is written in, lowercased: explicit (`sr-Latn`), or the CLDR likely script
 * (`zh-TW` maximizes to Hant, `sr` to Cyrl). `undefined` when the tag has no script data or the
 * runtime has no `Intl.Locale`.
 */
export function languageTagScript(tag: string | null | undefined): string | undefined {
  const normalized = normalizeLanguageTag(tag);
  if (!normalized || typeof Intl === 'undefined' || typeof Intl.Locale !== 'function') {
    return undefined;
  }
  if (scripts.has(normalized)) return scripts.get(normalized);
  let script: string | undefined;
  try {
    script = new Intl.Locale(normalized).maximize().script?.toLowerCase();
  } catch {
    // Not a tag `Intl.Locale` parses: no script data.
  }
  scripts.set(normalized, script);
  return script;
}

/**
 * Whether a catalog reached by widening serves a request in the same script. A tag without
 * script data passes, so a runtime without `Intl.Locale` resolves as plain RFC 4647 lookup.
 */
export function languageTagScriptsMatch(
  requested: string | null | undefined,
  candidate: string | null | undefined
): boolean {
  const requestedScript = languageTagScript(requested);
  const candidateScript = languageTagScript(candidate);
  return !requestedScript || !candidateScript || requestedScript === candidateScript;
}

/**
 * The catalog lookup sequence: the RFC 4647 sequence with the language and likely script
 * inserted before the bare language, so `zh-TW` yields `["zh-tw", "zh-hant", "zh"]`.
 */
function catalogLookupSequence(tag: string | null | undefined): string[] {
  const sequence = languageTagLookupSequence(tag);
  const script = languageTagScript(tag);
  if (!script || sequence.length < 2) return sequence;
  const language = sequence[sequence.length - 1];
  const withScript = `${language}-${script}`;
  if (sequence.includes(withScript)) return sequence;
  return [...sequence.slice(0, -1), withScript, language];
}

/**
 * Best available tag for a request, or `undefined`. Ranked by the request's specificity, so
 * `es-MX` prefers an `es-MX` candidate over an `es` one, and `zh-TW` reaches `zh-Hant`. A
 * catalog shorter than the request serves it only in the same script: a bare `zh` catalog is
 * Simplified, so `zh-TW` passes it by.
 */
export function findBestLanguageMatch(
  requested: string | null | undefined,
  available: readonly (string | null | undefined)[]
): string | undefined {
  const exact = normalizeLanguageTag(requested);
  for (const step of catalogLookupSequence(requested)) {
    const hit = available.find(
      (candidate) =>
        normalizeLanguageTag(candidate) === step &&
        (step === exact || languageTagScriptsMatch(requested, candidate))
    );
    if (hit != null) return hit;
  }
  return undefined;
}
